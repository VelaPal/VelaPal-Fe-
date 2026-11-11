import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadTs } from "./load-ts.mjs";
const api = await loadTs("lib/api.ts");
const { authService: auth } = await loadTs(
  "services/contracts/auth.service.ts",
);
const { disputesService: disputes } = await loadTs(
  "services/contracts/disputes.service.ts",
);
const { adminService: admin } = await loadTs(
  "services/contracts/admin.service.ts",
);
const { transactionsService: transactions } = await loadTs(
  "services/contracts/transactions.service.ts",
);
const { operationsService: operations } = await loadTs(
  "services/contracts/operations.service.ts",
);
const { agentService: agent } = await loadTs(
  "services/contracts/agent.service.ts",
);
const contract = fs.readFileSync(
  new URL("../velapal-v6.1-api-contract.md", import.meta.url),
  "utf8",
);
// Execute against the actual frozen JSON examples, rather than the old simulator's extensions.
const examples = [...contract.matchAll(/```json\s*([\s\S]*?)```/g)].flatMap(
  (match) => {
    try {
      return [JSON.parse(match[1].replace(/\{\s*\.\.\.\s*\}/g, "null"))];
    } catch {
      return [];
    }
  },
);
const sample = (predicate) => {
  const found = examples.find((x) => x.data && predicate(x.data));
  assert.ok(found, "Frozen response example exists");
  return structuredClone(found);
};
const session = sample((d) => d.status === "AUTHENTICATED");
const detail = sample((d) => d.case && d.sources);
let calls = [];
async function withFetch(run) {
  const original = globalThis.fetch;
  calls = [];
  api.setCsrfToken("csrf_test");
  try {
    await run();
  } finally {
    globalThis.fetch = original;
    api.cancelWorkspaceRequests();
    api.clearCsrfToken();
  }
}
function reply(payload, status = 200) {
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options });
    return status === 204
      ? new Response(null, { status })
      : Response.json(payload, { status });
  };
}
function envelope(data) {
  return {
    data,
    meta: {
      traceId: "test_trace",
      version: 6,
      timestamp: "2026-11-05T14:00:00.000Z",
    },
  };
}
function last(method, path, version) {
  const c = calls.at(-1);
  assert.equal(c.method, method);
  assert.equal(c.url, "/api/v1" + path);
  assert.equal(c.credentials, "include");
  assert.equal(c.cache, "no-store");
  if (method !== "GET") assert.ok(c.headers.get("X-CSRF-Token"));
  if (version !== undefined)
    assert.equal(c.headers.get("If-Match"), '"' + version + '"');
  if (c.body) assert.equal("expectedVersion" in JSON.parse(c.body), false);
  return c;
}
test("auth validates actual frozen sessions, challenges, workspace rotation and logout", () =>
  withFetch(async () => {
    reply(session);
    await auth.login("test@example.test", "test-password");
    assert.equal(api.currentCsrfToken(), session.data.csrfToken);
    last("POST", "/auth/login");
    await auth.restoreSession();
    last("GET", "/auth/session");
    const challenge = sample(
      (d) => d.challengeId && d.purpose === "ADMIN_INTERVENTION",
    );
    reply(challenge, 201);
    await auth.createMfaChallenge("ADMIN_INTERVENTION", "case_id");
    last("POST", "/auth/mfa/challenges");
    const verified = sample((d) => d.status === "STEP_UP_VERIFIED");
    reply(verified);
    await auth.verifyMfa("challenge", "123456");
    last("POST", "/auth/mfa/verify");
    reply(envelope({ items: [session.data.activeWorkspace] }));
    await auth.listWorkspaces();
    last("GET", "/me/workspaces");
    reply(sample((d) => d.activeWorkspace && !d.status));
    await auth.switchWorkspace("ws_sell_01");
    assert.equal(api.currentCsrfToken(), "csrf_rotated_8821");
    reply(null, 204);
    await auth.logout();
    assert.equal(api.currentCsrfToken(), null);
  }));
test("transactions, catalog, quote and minimal Admin detail bind frozen data without mock extensions", () =>
  withFetch(async () => {
    const tx = sample((d) => d.transaction && d.snapshot);
    reply(tx);
    await transactions.get(tx.data.transaction.id);
    last("GET", "/transactions/" + tx.data.transaction.id);
    reply(envelope({ items: [tx.data.transaction] }));
    await transactions.list();
    last("GET", "/transactions");
    reply(envelope({ items: [] }));
    assert.deepEqual(await transactions.catalog(), { items: [] });
    last("GET", "/catalog");
    reply(sample((d) => d.quoteId));
    await transactions.quote({
      productId: "prod",
      variantId: "variant",
      quantity: 1,
      spendingLimitMinor: 10000,
    });
    last("POST", "/quotes");
    reply(
      sample(
        (d) =>
          d.case?.investigationAccessGranted !== undefined && d.sharedSources,
      ),
    );
    const result = await admin.detail("case_id");
    assert.equal(result.case.category, undefined);
    assert.equal(result.sharedSources[0].scanState, undefined);
    last("GET", "/admin/disputes/case_id");
  }));
test("dispute mutation headers use the correct version axis and no mock bindings", () =>
  withFetch(async () => {
    reply(detail);
    const d = await disputes.get("case_id");
    assert.equal("mockConsentBindings" in d, false);
    last("GET", "/disputes/case_id");
    reply(
      sample((d) => d.caseId && d.stage === "AWAITING_EVIDENCE"),
      201,
    );
    await disputes.create(
      {
        transactionId: "tx",
        orderId: null,
        category: "ITEM_NOT_AS_DESCRIBED",
        statement: "Statement",
        audience: "CASE_SHARED",
      },
      "stable-dispute",
    );
    assert.equal(
      last("POST", "/disputes").headers.get("Idempotency-Key"),
      "stable-dispute",
    );
    reply(
      sample((d) => d.uploadHandle),
      201,
    );
    await disputes.uploadIntent("case_id", {
      mime: "image/jpeg",
      byteCount: 12,
      originalName: "evidence.jpg",
    });
    last("POST", "/disputes/case_id/sources/upload-intents");
    reply(
      sample((d) => d.indexJobStatus),
      202,
    );
    await disputes.finalize("case_id", "source_id", "upload_id", 1);
    last("POST", "/disputes/case_id/sources/source_id/finalize", 1);
    reply(envelope(detail.data.sources[0]));
    await disputes.getSource("case_id", "source_id");
    last("GET", "/disputes/case_id/sources/source_id");
    reply(sample((d) => d.sourceId && d.consentId));
    await disputes.shareSource(
      "case_id",
      "source_id",
      1,
      "CASE_SHARED",
      "authoritative-hash",
    );
    last("POST", "/disputes/case_id/sources/source_id/share", 1);
    reply(sample((d) => d.purgeScheduled));
    await disputes.revokeSource("case_id", "source_id", 2, "Wrong upload");
    last("POST", "/disputes/case_id/sources/source_id/revoke", 2);
    reply(
      sample((d) => d.messageId),
      201,
    );
    await disputes.message(
      "case_id",
      { text: "Private note", sourceRefs: [], audience: "PRIVATE" },
      2,
    );
    last("POST", "/disputes/case_id/messages", 2);
    await disputes.message(
      "case_id",
      { text: "Shared statement", sourceRefs: [], audience: "CASE_SHARED" },
      4,
    );
    last("POST", "/disputes/case_id/messages", 4);
    reply(
      sample((d) => d.runId && d.caseId && d.status === "QUEUED" && !d.purpose),
      202,
    );
    await disputes.assess("case_id", 5);
    last("POST", "/disputes/case_id/assessments", 5);
    reply(sample((d) => d.intent === "CONTINUE_MEDIATION"));
    await disputes.mediationConsent(
      "case_id",
      5,
      "run_id",
      "binding",
      "APPROVED",
    );
    last("POST", "/disputes/case_id/mediation-consents", 5);
    reply(
      sample((d) => d.proposalId && d.requiredConsents),
      201,
    );
    await disputes.propose("case_id", 5, {
      terms: "Exact terms",
      money: { amountMinor: 2000, currency: "USD" },
      route: "PAYPAL_CAPTURE_REFUND",
      sourceDigest: "manifest",
      expiresInMinutes: 60,
    });
    last("POST", "/disputes/case_id/proposals", 5);
    reply(
      sample((d) => d.reviewRequestId),
      201,
    );
    await disputes.requestReview("case_id", {
      reason: "Review reason",
      contestedFindingIds: [],
      newSourceRefs: [],
    });
    last("POST", "/disputes/case_id/reviews");
    reply(sample((d) => d.allRequiredConsentsMet));
    await disputes.grantConsent("action_id", 1, {
      paramsHash: "binding",
      caseVersion: 6,
      intent: "AUTHORIZE_FINANCIAL_EXECUTION",
      decision: "APPROVED",
      stepUpId: "scoped-step-up",
    });
    last("POST", "/action-requests/action_id/consents", 1);
    reply(
      sample((d) => d.operationStatus === "PENDING"),
      202,
    );
    await disputes.execute("action_id", 6, "binding", "stable-execution");
    assert.equal(
      last("POST", "/action-requests/action_id/execute", 6).headers.get(
        "Idempotency-Key",
      ),
      "stable-execution",
    );
  }));
test("Admin decisions use control/proposal versions; reconciliation preserves operation identity", () =>
  withFetch(async () => {
    reply(sample((d) => d.items?.[0]?.gateReason));
    await admin.disputes("NEEDS_REVIEW", true);
    last("GET", "/admin/disputes?filter=NEEDS_REVIEW&assignedToMe=true");
    reply(
      envelope({
        assignmentId: "assignment",
        caseId: "case_id",
        reviewerId: "reviewer",
        assignedAt: "2026-11-05T14:00:00.000Z",
      }),
    );
    await admin.assign("case_id", "reviewer", "Reason");
    last("POST", "/admin/disputes/case_id/assignments");
    reply(sample((d) => d.resumeTriggered));
    await admin.intervene(
      "case_id",
      2,
      "ALLOW_VOLUNTARY_MEDIATION",
      "Reason",
      "step_up",
    );
    last("POST", "/admin/disputes/case_id/interventions", 2);
    reply(sample((d) => d.items?.[0]?.approvalRequestId));
    await admin.approvalRequests();
    last("GET", "/admin/approval-requests");
    reply(sample((d) => d.decisionId && d.approvalRequestId));
    await admin.decideApproval("approval_id", 1, {
      decision: "APPROVED",
      scope: "SCOPE",
      paramsHash: "binding",
      caseVersion: 6,
      stepUpId: "scoped-step-up",
      reason: "Reason",
    });
    last("POST", "/admin/approval-requests/approval_id/decisions", 1);
    reply(sample((d) => d.items?.[0]?.auditId));
    await admin.auditEvents("case_id");
    last("GET", "/admin/audit-events?caseId=case_id");
    const op = sample((d) => d.operationId && d.status === "UNKNOWN");
    reply(op);
    await operations.get(op.data.operationId);
    last("GET", "/operations/" + op.data.operationId);
    reply(sample((d) => d.operationId && d.status === "SUCCEEDED"));
    await operations.reconcile(op.data.operationId, "stable-reconcile");
    assert.equal(
      last(
        "POST",
        "/operations/" + op.data.operationId + "/reconcile",
      ).headers.get("Idempotency-Key"),
      "stable-reconcile",
    );
    reply(
      sample(
        (d) => d.purpose === "CUSTOMER_PREPARATION" && d.status === "QUEUED",
      ),
      202,
    );
    const run = await agent.start("CUSTOMER_PREPARATION", "case_id", "Help");
    last("POST", "/agent/runs");
    await agent.get(run.runId);
    last("GET", "/agent/runs/" + run.runId);
  }));
test("invalid financial acknowledgments and undefined checkout DTOs cannot produce success", () =>
  withFetch(async () => {
    reply(envelope({ accepted: true }), 202);
    await assert.rejects(
      disputes.execute("action", 6, "hash", "same-key"),
      (e) => e.code === "INVALID_RESPONSE" && e.traceId === "test_trace",
    );
    const count = calls.length;
    await assert.rejects(
      transactions.createCheckoutOrder(),
      (e) => e.code === "INTEGRATION_UNAVAILABLE",
    );
    await assert.rejects(
      transactions.captureCheckoutOrder(),
      (e) => e.code === "INTEGRATION_UNAVAILABLE",
    );
    assert.equal(calls.length, count);
  }));
