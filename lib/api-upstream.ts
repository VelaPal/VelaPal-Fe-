/** Same-origin browser requests are forwarded exclusively to Express. */
export function resolveApiUpstream({
  upstream,
  frontendPort = "3000",
}: {
  upstream?: string;
  frontendPort?: string;
}): string {
  const configured = (upstream || "http://localhost:4000").replace(/\/$/, "");
  const target = new URL(configured);
  if (!["http:", "https:"].includes(target.protocol))
    throw new Error("API_UPSTREAM must use http or https.");
  if (
    target.username ||
    target.password ||
    target.search ||
    target.hash ||
    target.pathname !== "/"
  )
    throw new Error(
      "API_UPSTREAM must be an origin without credentials, path, query or fragment.",
    );
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname);
  const port = target.port || (target.protocol === "https:" ? "443" : "80");
  if (local && port === frontendPort)
    throw new Error(
      "API_UPSTREAM cannot point back to the frontend. Use the Express backend origin.",
    );
  return configured;
}
