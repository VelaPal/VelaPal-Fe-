import { z } from "zod";
export const moneyMinor = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER);
export const paymentStatus = z.enum([
  "APPROVAL_PENDING",
  "UNCONFIRMED",
  "PAID",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
  "FAILED",
  "UNKNOWN",
]);
export const transactionDto = z.object({
  id: z.string(),
  orderId: z.string(),
  customerId: z.string(),
  merchantId: z.string(),
  merchantName: z.string(),
  paypalOrderId: z.string().nullable(),
  paypalCaptureId: z.string().nullable(),
  amountMinor: moneyMinor,
  refundableRemainingMinor: moneyMinor,
  currency: z.literal("USD"),
  paymentStatus,
  verifiedAt: z.string().nullable(),
});
export const snapshotDto = z.object({
  snapshotId: z.string(),
  sku: z.string(),
  variantId: z.string(),
  quantity: z.number().int().positive().optional(),
  amountMinor: moneyMinor,
  currency: z.literal("USD"),
  snapshotHash: z.string().optional(),
});
export const transactionDetailDto = z.object({
  transaction: transactionDto,
  snapshot: snapshotDto,
  activeCaseId: z.string().nullable(),
});
export const catalogDto = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      merchantId: z.string(),
      variants: z.array(z.object({ id: z.string(), amountMinor: moneyMinor })),
      currency: z.literal("USD"),
    }),
  ),
});
export const quoteDto = z.object({
  quoteId: z.string(),
  merchantId: z.string(),
  productId: z.string(),
  sku: z.string(),
  variantId: z.string(),
  quantity: z.number().int().positive(),
  spendingLimitMinor: moneyMinor,
  amountMinor: moneyMinor,
  currency: z.literal("USD"),
  quoteVersion: z.number().int().positive(),
  expiresAt: z.string(),
  ruleResult: z.string(),
});

export const version = z.number().int().nonnegative();
export const party = z.enum(["CUSTOMER", "SELLER"]);
export const audience = z.enum([
  "PRIVATE",
  "CASE_SHARED",
  "PROVIDER_SHARED",
  "REVOKED",
]);
export const stage = z.enum([
  "AWAITING_EVIDENCE",
  "MEDIATING",
  "AWAITING_CONSENT",
  "EXECUTION_PENDING",
  "EXECUTION_UNKNOWN",
  "EXTERNAL_PENDING",
  "RESOLVED",
  "CLOSED_NO_AGREEMENT",
]);
export const control = z.enum(["RUNNING", "WAITING_ADMIN", "PAUSED", "MANUAL"]);
export const operationStatus = z.enum([
  "IDLE",
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "UNKNOWN",
  "UNAVAILABLE",
]);
export const operationType = z.enum([
  "ORDER_CAPTURE",
  "CAPTURE_REFUND",
  "DISPUTE_MAKE_OFFER",
  "SUBSCRIPTION_CANCEL",
]);
export const route = z.enum([
  "PAYPAL_CAPTURE_REFUND",
  "PAYPAL_DISPUTE_MAKE_OFFER",
  "OFFICIAL_HANDOFF",
]);
export const scanState = z.enum([
  "QUARANTINED",
  "SCANNING",
  "CLEAN",
  "REJECTED",
]);
export const category = z.enum([
  "ITEM_NOT_AS_DESCRIBED",
  "ITEM_NOT_RECEIVED",
  "PAYMENT_NOT_CONFIRMED",
  "FULFILMENT_OR_RETURN_ISSUE",
  "BILLING_OR_RENEWAL_CONCERN",
  "CONTESTED_CLAIM",
]);
export const consentIntent = z.enum([
  "SHARE_SOURCE",
  "CONTINUE_MEDIATION",
  "ACCEPT_PROPOSAL_TERMS",
  "AUTHORIZE_FINANCIAL_EXECUTION",
]);
export const decision = z.enum(["APPROVED", "REJECTED"]);
export const workspaceDto = z.object({
  workspaceId: z.string().min(1),
  type: z.enum(["CUSTOMER", "SELLER", "ADMIN"]),
  name: z.string(),
  merchantId: z.string().nullable(),
  role: z.string(),
});
export const sessionDto = z.object({
  status: z.literal("AUTHENTICATED"),
  csrfToken: z.string().min(1),
  user: z.object({
    id: z.string().min(1),
    email: z.string(),
    name: z.string(),
  }),
  activeWorkspace: workspaceDto,
  purpose: z.literal("SESSION_LOGIN").optional(),
});
export const loginDto = z.union([
  sessionDto,
  z.object({
    status: z.literal("MFA_REQUIRED"),
    challengeId: z.string().min(1),
    purpose: z.literal("SESSION_LOGIN"),
    targetId: z.null(),
    expiresAt: z.string(),
  }),
]);
export const stepUpChallengeDto = z.object({
  challengeId: z.string().min(1),
  purpose: z.enum([
    "ADMIN_INTERVENTION",
    "ADMIN_APPROVAL",
    "WORKSPACE_SWITCH",
    "MERCHANT_EXECUTION",
  ]),
  targetId: z.string(),
  expiresAt: z.string(),
});
export const stepUpDto = z.object({
  status: z.literal("STEP_UP_VERIFIED"),
  stepUpId: z.string().min(1),
  purpose: z.string(),
  targetId: z.string().nullable(),
  expiresAt: z.string(),
});
export const mfaDto = z.union([sessionDto, stepUpDto]);
export const switchWorkspaceDto = z.object({
  activeWorkspace: workspaceDto,
  csrfToken: z.string().min(1),
});
export const sourceRefDto = z.object({
  sourceId: z.string(),
  version,
  locator: z.string(),
});
export const sourceDto = z.object({
  sourceId: z.string(),
  sourceVersion: version,
  ownerParty: party,
  originalName: z.string(),
  mime: z.string(),
  scanState,
  audience,
  sha256: z.string().nullable(),
  locator: z.string().nullable(),
  previewUrl: z.string().nullable().optional(),
});
const factDto = z.object({
  text: z.string(),
  sourceRefs: z.array(sourceRefDto),
});
export const assessmentDto = z.object({
  runId: z.string(),
  inputVersion: version,
  status: z.enum([
    "QUEUED",
    "RUNNING",
    "NEEDS_INFO",
    "COMPLETED",
    "ABSTAINED",
    "STALE",
    "FAILED",
  ]),
  audience,
  modelMode: z.enum(["live", "fixture"]),
  businessDataMode: z.enum(["paypal_sandbox", "synthetic_fixture"]),
  category: category.optional(),
  verifiedFacts: z.array(factDto).optional(),
  claims: z.array(factDto.extend({ party })).optional(),
  findings: z
    .array(factDto.extend({ findingId: z.string(), kind: z.string() }))
    .optional(),
  missingEvidence: z.array(z.string()).optional(),
  uncertainty: z.string().optional(),
  policyReferences: z.array(z.string()).optional(),
  nextStep: z.enum([
    "REQUEST_CLARIFICATION",
    "REQUEST_PACKING_SERIAL",
    "REQUEST_PAYMENT_PROOF",
    "PROPOSE_VOLUNTARY_SETTLEMENT",
    "ESCALATE_TO_ADMIN",
    "OFFICIAL_CHANNEL_HANDOFF",
    "NONE",
  ]),
  requiresHumanApproval: z.boolean(),
  error: z
    .object({ code: z.string(), message: z.string(), retryable: z.boolean() })
    .optional(),
});
export const caseDto = z.object({
  caseId: z.string().min(1),
  transactionId: z.string().nullable(),
  orderId: z.string().nullable(),
  merchantId: z.string(),
  initiatorParty: party,
  category,
  stage,
  control,
  caseVersion: version,
  controlVersion: version,
  privateContextVersion: version,
  accessRevision: version,
  nextAction: z.string(),
  officialPaypalDisputeId: z.string().nullable(),
  capabilities: z.object({
    canShareEvidence: z.boolean(),
    canPostMessage: z.boolean(),
    canProposeTerms: z.boolean(),
    canGrantConsent: z.boolean(),
    canExecuteSettlement: z.boolean(),
    canRequestReview: z.boolean(),
    supportedSettlementRoutes: z.array(route),
  }),
});
// List shape is intentionally minimal: the contract only guarantees case metadata.
export const caseListItemDto = caseDto
  .pick({
    caseId: true,
    transactionId: true,
    orderId: true,
    merchantId: true,
    initiatorParty: true,
    category: true,
    stage: true,
    control: true,
    caseVersion: true,
    controlVersion: true,
    privateContextVersion: true,
    accessRevision: true,
    nextAction: true,
  })
  .partial({
    orderId: true,
    merchantId: true,
    privateContextVersion: true,
    accessRevision: true,
    nextAction: true,
  });
export const caseCreatedDto = caseDto.omit({
  merchantId: true,
  officialPaypalDisputeId: true,
  capabilities: true,
});
export const proposalDto = z.object({
  proposalId: z.string(),
  proposalVersion: version,
  proposerParty: party,
  caseVersion: version,
  actionRequestId: z.string(),
  terms: z.string(),
  money: z.object({ amountMinor: moneyMinor, currency: z.literal("USD") }),
  route,
  sourceDigest: z.string(),
  paramsHash: z.string().min(1),
  status: z.string(),
  expiresAt: z.string(),
});
export const disputeDetailDto = z.object({
  case: caseDto,
  providerOperation: z.object({
    operationId: z.string().nullable(),
    type: operationType.nullable(),
    route: route.nullable(),
    status: operationStatus,
    providerRef: z.string().nullable(),
    verifiedAt: z.string().nullable(),
  }),
  snapshot: snapshotDto,
  perspectives: z.object({
    customerStatement: z.string().nullable(),
    sellerStatement: z.string().nullable(),
  }),
  sources: z.array(sourceDto),
  messages: z.array(
    z.object({
      messageId: z.string(),
      authorParty: party,
      audience,
      text: z.string(),
      sourceRefs: z.array(sourceRefDto),
      createdAt: z.string(),
    }),
  ),
  latestAssessment: assessmentDto.nullable(),
  activeProposal: proposalDto.nullable(),
  pendingConsents: z.array(
    z.object({
      party,
      intent: consentIntent,
      status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
      approvedAt: z.string().nullable(),
    }),
  ),
  activityTimeline: z.array(
    z.object({
      eventId: z.string(),
      type: z.string(),
      actorParty: z.enum(["CUSTOMER", "SELLER", "ADMIN"]),
      summary: z.string(),
      caseVersion: version,
      at: z.string(),
    }),
  ),
});
export const uploadIntentDto = z.object({
  sourceId: z.string().min(1),
  uploadId: z.string().min(1),
  sourceVersion: version,
  audience: z.literal("PRIVATE"),
  scanState: z.literal("QUARANTINED"),
  uploadHandle: z.object({
    method: z.literal("PUT"),
    url: z.string().min(1),
    expiresInSeconds: z.number().positive(),
  }),
});
export const finalizedSourceDto = z.object({
  sourceId: z.string(),
  sourceVersion: version,
  audience,
  scanState,
  readyForAnalysis: z.boolean(),
  indexJobStatus: z.string(),
});
export const sourceChangeDto = z.object({
  sourceId: z.string(),
  sourceVersion: version,
  caseVersion: version,
  accessRevision: version,
});
export const messageCreatedDto = z.object({
  messageId: z.string().min(1),
  party,
  audience,
  caseVersion: version,
  privateContextVersion: version,
});
export const assessmentQueuedDto = z.object({
  runId: z.string().min(1),
  caseId: z.string(),
  inputVersion: version,
  status: z.literal("QUEUED"),
});
export const mediationConsentDto = z.object({
  consentId: z.string().min(1),
  caseId: z.string(),
  party,
  intent: z.literal("CONTINUE_MEDIATION"),
  decision,
  caseVersion: version,
  approvedAt: z.string().nullable(),
});
export const proposalCreatedDto = z.object({
  proposalId: z.string().min(1),
  proposalVersion: version,
  proposerParty: party,
  caseVersion: version,
  stage,
  actionRequestId: z.string().min(1),
  paramsHash: z.string().min(1),
  requiredConsents: z.array(
    z.object({ party, intent: consentIntent, status: z.string() }),
  ),
  expiresAt: z.string(),
});
export const reviewCreatedDto = z.object({
  reviewRequestId: z.string().min(1),
  caseId: z.string(),
  control,
  controlVersion: version,
  caseVersion: version,
});
export const consentDto = z.object({
  consentId: z.string().min(1),
  actionRequestId: z.string(),
  party,
  intent: z.enum(["ACCEPT_PROPOSAL_TERMS", "AUTHORIZE_FINANCIAL_EXECUTION"]),
  decision,
  paramsHash: z.string().min(1),
  allRequiredConsentsMet: z.boolean(),
  approvedAt: z.string().nullable(),
  expiresAt: z.string(),
});
export const executionDto = z.object({
  operationId: z.string().min(1),
  type: operationType,
  actionRequestId: z.string(),
  caseStage: stage,
  operationStatus,
  pollUrl: z.string(),
});
export const operationDto = z.object({
  operationId: z.string().min(1),
  type: operationType,
  actionRequestId: z.string().nullable(),
  caseId: z.string().nullable(),
  route,
  status: operationStatus,
  amountMinor: moneyMinor,
  currency: z.literal("USD"),
  providerRef: z.string().nullable(),
  lastCheckedAt: z.string().nullable(),
  verifiedAt: z.string().nullable(),
  nextStep: z.string(),
  caseStage: stage.optional(),
});
export const agentRunDto = z.object({
  runId: z.string().min(1),
  purpose: z.enum([
    "PERSONAL_ASSISTANT",
    "CUSTOMER_PREPARATION",
    "SELLER_PREPARATION",
    "SHARED_ASSESSMENT",
  ]),
  audience,
  status: z.enum([
    "QUEUED",
    "RUNNING",
    "NEEDS_INFO",
    "COMPLETED",
    "ABSTAINED",
    "STALE",
    "FAILED",
  ]),
  pollUrl: z.string().optional(),
  inputVersion: version.optional(),
  caseId: z.string().nullable().optional(),
  modelMode: z.enum(["live", "fixture"]).optional(),
  businessDataMode: z.enum(["paypal_sandbox", "synthetic_fixture"]).optional(),
  result: z.unknown().optional(),
});
export const adminCaseDto = z.object({
  caseId: z.string(),
  transactionId: z.string().nullable(),
  merchantId: z.string(),
  initiatorParty: party,
  stage,
  control,
  controlVersion: version,
  caseVersion: version,
  gateReason: z.string().nullable(),
  assignedReviewerId: z.string().nullable(),
  pendingApprovalRequestId: z.string().nullable(),
  updatedAt: z.string(),
});
export const adminDetailDto = z.object({
  case: adminCaseDto
    .omit({ gateReason: true, pendingApprovalRequestId: true, updatedAt: true })
    .extend({
      investigationAccessGranted: z.boolean(),
      category: category.optional(),
      orderId: z.string().nullable().optional(),
      officialPaypalDisputeId: z.string().nullable().optional(),
    }),
  sharedSources: z
    .array(
      sourceDto
        .pick({
          sourceId: true,
          sourceVersion: true,
          ownerParty: true,
          originalName: true,
          locator: true,
        })
        .extend({ scanState: scanState.optional() }),
    )
    .optional(),
  sharedPerspectives: z
    .object({
      customerStatement: z.string().nullable(),
      sellerStatement: z.string().nullable(),
    })
    .optional(),
  latestAssessment: assessmentDto.nullable().optional(),
  pendingApprovalRequests: z.array(z.unknown()).optional(),
});
export const approvalDto = z.object({
  approvalRequestId: z.string(),
  caseId: z.string(),
  actionRequestId: z.string(),
  scope: z.string(),
  amountMinor: moneyMinor,
  currency: z.literal("USD"),
  paramsHash: z.string(),
  caseVersion: version,
  proposalVersion: version,
  status: z.string(),
  createdAt: z.string(),
});
export const assignmentDto = z.object({
  assignmentId: z.string().min(1),
  caseId: z.string(),
  reviewerId: z.string(),
  assignedAt: z.string(),
});
export const interventionDto = z.object({
  decisionId: z.string().min(1),
  caseId: z.string(),
  control,
  controlVersion: version,
  stage,
  caseVersion: version,
  resumeTriggered: z.boolean(),
});
export const approvalDecisionDto = z.object({
  decisionId: z.string().min(1),
  approvalRequestId: z.string(),
  decision,
  expiresAt: z.string(),
});
export const auditDto = z.object({
  auditId: z.string(),
  eventName: z.string(),
  actorId: z.string(),
  workspaceId: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  reason: z.string(),
  caseVersion: version,
  controlVersion: version,
  traceId: z.string(),
  createdAt: z.string(),
});
export const itemsDto = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable().optional(),
  });
