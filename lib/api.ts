import type {
  ApiEnvelope,
  ApiErrorBody,
  ApiMeta,
} from "@/services/contracts/types";

/** Accept an Express origin or its public prefix. Never configure secrets here. */
export function resolveApiBaseUrl(
  value = process.env.NEXT_PUBLIC_API_BASE_URL,
) {
  const configured = (value || "/api/v1").replace(/\/+$/, "");
  if (configured === "/api/v1") return configured;
  const url = new URL(configured);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !["", "/", "/api/v1"].includes(url.pathname)
  )
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL must be an Express origin or /api/v1 URL.",
    );
  return url.origin + "/api/v1";
}
let csrfToken: string | null = null;
let workspaceController = new AbortController();
export function workspaceRequestSignal() {
  return workspaceController.signal;
}
export function cancelWorkspaceRequests() {
  workspaceController.abort();
  workspaceController = new AbortController();
}
export function setCsrfToken(token: string | null) {
  csrfToken = token;
}
export function clearCsrfToken() {
  csrfToken = null;
}
export function currentCsrfToken() {
  return csrfToken;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly traceId: string,
    public readonly retryable: boolean,
    public readonly fieldErrors: Record<string, unknown> = {},
    public readonly currentVersion?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function checkRequestSignal(signal: AbortSignal) {
  if (!signal.aborted) return;
  if (signal.reason?.name === "TimeoutError")
    throw new ApiError(
      0,
      "REQUEST_TIMEOUT",
      "Request timed out. Check operation status before retrying a financial action.",
      "",
      true,
    );
  signal.throwIfAborted();
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Exact frozen contract: If-Match is a quoted integer version, NOT a body field. */
  ifMatch?: number;
  idempotencyKey?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}

/** Returns data and meta so caller can audit traceId and optimistic versions. */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiEnvelope<T>> {
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.startsWith("/internal/") ||
    /[\\#]|%(?:2e|2f|5c)/i.test(path.split("?")[0]) ||
    path.split("?")[0].includes("..") ||
    path.startsWith("/api/") ||
    path.startsWith("/webhooks/")
  )
    throw new ApiError(
      0,
      "INVALID_PUBLIC_PATH",
      "Only public /api/v1 service paths are allowed.",
      "",
      false,
    );
  const method = options.method ?? "GET";
  const headers = new Headers({ Accept: "application/json" });
  if (options.body !== undefined)
    headers.set("Content-Type", "application/json");
  if (method !== "GET" && csrfToken) headers.set("X-CSRF-Token", csrfToken);
  if (
    method !== "GET" &&
    !(path === "/auth/login" || (path === "/auth/mfa/verify" && !csrfToken))
  ) {
    if (!csrfToken)
      throw new ApiError(
        0,
        "CSRF_NOT_INITIALIZED",
        "Restore session before mutating data.",
        "",
        false,
      );
    headers.set("X-CSRF-Token", csrfToken);
  }
  if (
    options.ifMatch !== undefined &&
    (!Number.isSafeInteger(options.ifMatch) || options.ifMatch < 0)
  )
    throw new ApiError(
      0,
      "INVALID_VERSION",
      "If-Match requires a nonnegative integer version.",
      "",
      false,
    );
  if (options.ifMatch !== undefined)
    headers.set("If-Match", `"${options.ifMatch}"`);
  if (options.idempotencyKey)
    headers.set("Idempotency-Key", options.idempotencyKey);
  let response: Response;
  const signal = AbortSignal.any([
    workspaceController.signal,
    ...(options.signal ? [options.signal] : []),
    AbortSignal.timeout(options.timeoutMs ?? 20000),
  ]);
  const baseUrl = resolveApiBaseUrl();
  checkRequestSignal(signal);
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: "include",
      cache: "no-store",
      signal,
    });
  } catch {
    if (signal.aborted && signal.reason?.name !== "TimeoutError")
      throw signal.reason;
    throw new ApiError(
      0,
      signal.reason?.name === "TimeoutError"
        ? "REQUEST_TIMEOUT"
        : "NETWORK_ERROR",
      "Request could not be confirmed. Check operation status before retrying a financial action.",
      "",
      true,
    );
  }
  checkRequestSignal(signal);
  if (response.ok && response.status === 204)
    return {
      data: undefined as T,
      meta: {
        traceId: response.headers.get("x-trace-id") || "",
        version: 0,
        timestamp: new Date().toISOString(),
      },
    };
  const payload: unknown = await response.json().catch(() => null);
  checkRequestSignal(signal);
  if (!response.ok) {
    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      path !== "/auth/login" &&
      path !== "/auth/session" &&
      path !== "/auth/mfa/verify"
    )
      window.dispatchEvent(new Event("velapal:session-expired"));
    if (response.status === 401) clearCsrfToken();
    const error =
      payload && typeof payload === "object" && "error" in payload
        ? (payload as ApiErrorBody).error
        : null;
    throw new ApiError(
      response.status,
      error?.code ?? "HTTP_ERROR",
      error?.message ?? `HTTP ${response.status}`,
      error?.traceId ?? "",
      error?.retryable ?? false,
      error?.fieldErrors ?? {},
      error?.currentVersion,
    );
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    !("data" in payload) ||
    !("meta" in payload) ||
    !payload.meta ||
    typeof payload.meta !== "object" ||
    !("traceId" in payload.meta) ||
    typeof payload.meta.traceId !== "string" ||
    !("version" in payload.meta) ||
    typeof payload.meta.version !== "number" ||
    !("timestamp" in payload.meta) ||
    typeof payload.meta.timestamp !== "string"
  )
    throw new ApiError(
      response.status,
      "INVALID_ENVELOPE",
      "Response does not match frozen API envelope.",
      "",
      false,
    );
  return payload as ApiEnvelope<T>;
}
export async function apiData<T>(
  path: string,
  opts?: RequestOptions,
): Promise<T> {
  return (await apiRequest<T>(path, opts)).data;
}
export type { ApiMeta };

/** Validate a DTO before any caller can announce success or use server capabilities. */
export async function apiValidated<T>(
  path: string,
  schema: { parse: (value: unknown) => T },
  options?: RequestOptions,
): Promise<T> {
  const response = await apiRequest<unknown>(path, options);
  try {
    return schema.parse(response.data);
  } catch {
    throw new ApiError(
      502,
      "INVALID_RESPONSE",
      "The API returned an invalid response. Refresh before taking another action.",
      response.meta.traceId,
      false,
      {},
      response.meta.version,
    );
  }
}

/** The only non-JSON transfer is a backend-issued, short-lived object-storage handle. */
export async function uploadToHandle(
  handle: { method: "PUT"; url: string },
  blob: Blob,
  signal?: AbortSignal,
) {
  const url = new URL(
    handle.url,
    typeof window !== "undefined" ? window.location.origin : undefined,
  );
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname.startsWith("/internal/") ||
    handle.method !== "PUT"
  )
    throw new ApiError(
      0,
      "INVALID_UPLOAD_HANDLE",
      "Invalid evidence upload handle.",
      "",
      false,
    );
  const requestSignal = AbortSignal.any([
    workspaceRequestSignal(),
    ...(signal ? [signal] : []),
    AbortSignal.timeout(60000),
  ]);
  let response: Response;
  try {
    response = await fetch(url.href, {
      method: handle.method,
      body: blob,
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: requestSignal,
    });
  } catch {
    if (requestSignal.aborted && requestSignal.reason?.name !== "TimeoutError")
      throw requestSignal.reason;
    throw new ApiError(
      0,
      "UPLOAD_FAILED",
      "Evidence upload could not be confirmed. Finalization has not been requested.",
      "",
      true,
    );
  }
  requestSignal.throwIfAborted();
  if (!response.ok)
    throw new ApiError(
      response.status,
      "UPLOAD_FAILED",
      "Evidence upload failed. Finalization has not been requested.",
      "",
      response.status >= 500,
    );
}
