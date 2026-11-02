export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}


export async function getJson(path: string): Promise<unknown> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL belum diatur.");
  }

  const url =`${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new ApiError(
      `Request gagal dengan status ${response.status}.`,
      response.status,
    );
  }

  const body: unknown = await response.json();

  return body;
}