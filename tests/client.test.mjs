import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
// Execute the actual frontend client with a controlled Fetch boundary.
const source = fs.readFileSync(
  new URL("../lib/api.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
}).outputText;
const client = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);
test("client sends cookie credentials, exact CSRF, If-Match and idempotency headers", async () => {
  const original = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, ...options };
    return Response.json({
      data: { accepted: true },
      meta: {
        traceId: "tr_test",
        version: 6,
        timestamp: new Date().toISOString(),
      },
    });
  };
  try {
    client.setCsrfToken("csrf_test");
    const response = await client.apiRequest("/disputes", {
      method: "POST",
      body: { statement: "Test" },
      ifMatch: 6,
      idempotencyKey: "stable-key",
    });
    assert.equal(response.data.accepted, true);
    assert.equal(request.url, "/api/v1/disputes");
    assert.equal(request.credentials, "include");
    assert.equal(request.headers.get("X-CSRF-Token"), "csrf_test");
    assert.equal(request.headers.get("If-Match"), '"6"');
    assert.equal(request.headers.get("Idempotency-Key"), "stable-key");
    assert.deepEqual(JSON.parse(request.body), { statement: "Test" });
  } finally {
    globalThis.fetch = original;
  }
});
test("client preserves structured HTTP failures and rejects internal service paths", async () => {
  const original = globalThis.fetch;
  try {
    for (const status of [401, 403, 409, 422, 429, 503]) {
      globalThis.fetch = async () =>
        Response.json(
          {
            error: {
              code: "TEST_ERROR",
              message: "Contract failure",
              traceId: "tr_failure",
              retryable: status === 503,
              currentVersion: 9,
              fieldErrors: { statement: "Invalid" },
            },
          },
          { status },
        );
      await assert.rejects(
        client.apiData("/disputes"),
        (e) =>
          e instanceof client.ApiError &&
          e.status === status &&
          e.currentVersion === 9 &&
          e.traceId === "tr_failure",
      );
    }
    await assert.rejects(
      client.apiData("/internal/v1/case-runs"),
      (e) => e.code === "INVALID_PUBLIC_PATH",
    );
  } finally {
    globalThis.fetch = original;
  }
});
test("workspace change aborts in-flight requests; empty 204 and malformed envelopes handled", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = (_url, options) =>
      new Promise((_resolve, reject) =>
        options.signal.addEventListener("abort", () =>
          reject(new DOMException("Cancelled", "AbortError")),
        ),
      );
    const pending = client.apiData("/transactions");
    client.cancelWorkspaceRequests();
    await assert.rejects(pending, (e) => e.name === "AbortError");
    client.setCsrfToken("csrf_test");
    globalThis.fetch = async () => new Response(null, { status: 204 });
    assert.equal(
      await client.apiData("/auth/logout", { method: "POST" }),
      undefined,
    );
    globalThis.fetch = async () => Response.json({ items: [] });
    await assert.rejects(
      client.apiData("/transactions"),
      (e) => e.code === "INVALID_ENVELOPE",
    );
    client.clearCsrfToken();
    await assert.rejects(
      client.apiData("/disputes", { method: "POST", body: {} }),
      (e) => e.code === "CSRF_NOT_INITIALIZED",
    );
  } finally {
    globalThis.fetch = original;
  }
});

test("a response cancelled during JSON parsing cannot populate the next workspace", async () => {
  const original = globalThis.fetch;
  let finish;
  try {
    globalThis.fetch = async () => ({
      status: 200,
      ok: true,
      json: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    });
    const pending = client.apiData("/auth/session");
    await new Promise((resolve) => setImmediate(resolve));
    client.cancelWorkspaceRequests();
    finish({
      data: { oldWorkspace: true },
      meta: {
        traceId: "tr_old",
        version: 1,
        timestamp: new Date().toISOString(),
      },
    });
    await assert.rejects(pending, (e) => e.name === "AbortError");
  } finally {
    globalThis.fetch = original;
  }
});

test("base URL normalization supports same-origin and direct Express without duplicate prefixes", () => {
  assert.equal(client.resolveApiBaseUrl("/api/v1/"), "/api/v1");
  assert.equal(
    client.resolveApiBaseUrl("http://localhost:4000"),
    "http://localhost:4000/api/v1",
  );
  assert.equal(
    client.resolveApiBaseUrl("https://api.example.test/api/v1/"),
    "https://api.example.test/api/v1",
  );
  for (const value of [
    "http://user:secret@example.test",
    "http://example.test/internal/v1",
    "//example.test",
    "https://example.test?key=x",
  ])
    assert.throws(() => client.resolveApiBaseUrl(value));
});
test("cancellation, bounded timeouts and network failures never use a data fallback or automatic retry", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  try {
    globalThis.fetch = async () => {
      calls++;
      throw new TypeError("offline");
    };
    await assert.rejects(
      client.apiData("/transactions"),
      (e) => e.code === "NETWORK_ERROR",
    );
    assert.equal(calls, 1);
    globalThis.fetch = (_url, { signal }) =>
      new Promise((_resolve, reject) =>
        signal.addEventListener("abort", () => reject(signal.reason), {
          once: true,
        }),
      );
    const controller = new AbortController();
    const pending = client.apiData("/transactions", {
      signal: controller.signal,
    });
    controller.abort();
    await assert.rejects(pending, (e) => e.name === "AbortError");
    // Keep the event loop alive because AbortSignal.timeout uses an unref'd timer.
    const keepAlive = setTimeout(() => {}, 1000);
    try {
      await assert.rejects(
        client.apiData("/transactions", {
          signal: new AbortController().signal,
          timeoutMs: 5,
        }),
        (e) => e.code === "REQUEST_TIMEOUT",
      );
    } finally {
      clearTimeout(keepAlive);
    }
  } finally {
    globalThis.fetch = original;
    client.cancelWorkspaceRequests();
  }
});
test("public client rejects traversal, internal credentials and invalid versions before sending a request", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw Error("Unexpected fetch");
  };
  try {
    for (const path of [
      "https://other.test",
      "//other.test",
      "/internal/v1/case-runs",
      "/api/v1/auth/session",
      "/../internal/v1",
      "/%2e%2e/internal/v1",
      "/x\\..\\internal/v1",
      "/webhooks/paypal",
    ])
      await assert.rejects(
        client.apiData(path),
        (e) => e.code === "INVALID_PUBLIC_PATH",
      );
    await assert.rejects(
      client.apiData("/disputes", { ifMatch: 1.5 }),
      (e) => e.code === "INVALID_VERSION",
    );
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
  }
});
test("backend-issued evidence byte upload never forwards API cookies or CSRF", async () => {
  const original = globalThis.fetch;
  let options;
  globalThis.fetch = async (_url, request) => {
    options = request;
    return new Response(null, { status: 200 });
  };
  try {
    client.setCsrfToken("csrf_test");
    await client.uploadToHandle(
      {
        method: "PUT",
        url: "https://storage.example.test/quarantine/file?sig=short-lived",
      },
      new Blob(["evidence"]),
    );
    assert.equal(options.credentials, "omit");
    assert.equal(options.headers, undefined);
    assert.equal(options.referrerPolicy, "no-referrer");
    await assert.rejects(
      client.uploadToHandle(
        {
          method: "PUT",
          url: "https://storage.example.test/internal/v1/context",
        },
        new Blob(["x"]),
      ),
      (e) => e.code === "INVALID_UPLOAD_HANDLE",
    );
  } finally {
    globalThis.fetch = original;
  }
});

test("a timeout while reading the response body remains a structured API failure", async () => {
  const original = globalThis.fetch,
    keepAlive = setTimeout(() => {}, 1000);
  try {
    globalThis.fetch = async (_url, { signal }) => ({
      status: 200,
      ok: true,
      json: () =>
        new Promise((_resolve, reject) =>
          signal.addEventListener("abort", () => reject(signal.reason), {
            once: true,
          }),
        ),
    });
    await assert.rejects(
      client.apiData("/transactions", { timeoutMs: 5 }),
      (e) => e instanceof client.ApiError && e.code === "REQUEST_TIMEOUT",
    );
  } finally {
    clearTimeout(keepAlive);
    globalThis.fetch = original;
  }
});
