/** Frontend liveness only; this does not report backend/provider health. */
export function GET() {
  return Response.json({ status: "ok", service: "velapal-web" });
}
