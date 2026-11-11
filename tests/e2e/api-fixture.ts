import {
  test as base,
  expect,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { handleEmbeddedMock } from "../fixtures/mock-api/embedded-handler";
/** A test-only network boundary. The built app never imports this fixture. */
export async function installApiFixture(context: BrowserContext) {
  for (const pattern of ["**/api/v1/**", "**/__mock_upload/**"]) {
    await context.route(pattern, async (route) => {
      const incoming = route.request();
      const response = await handleEmbeddedMock(
        new Request(incoming.url(), {
          method: incoming.method(),
          headers: await incoming.allHeaders(),
          body:
            incoming.method() === "GET" || incoming.method() === "HEAD"
              ? undefined
              : incoming.postDataBuffer()
                ? new Uint8Array(incoming.postDataBuffer()!)
                : undefined,
        }),
      );
      await route.fulfill({
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: Buffer.from(await response.arrayBuffer()),
      });
    });
  }
}
export const test = base.extend<{ apiBoundary: void }>({
  apiBoundary: [
    async ({ context }, use) => {
      await installApiFixture(context);
      await use();
    },
    { auto: true },
  ],
});
export { expect };
export async function login(page: Page, role: "customer" | "seller" | "admin") {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(role + "@velapal.demo");
  await page.getByLabel("Password", { exact: true }).fill("demo12345");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  if (role === "admin") {
    await page.getByLabel("Authentication code").fill("123456");
    await page.getByRole("button", { name: "Verify and sign in" }).click();
  }
  await expect(page).toHaveURL("/workspace");
  await expect(
    page.getByRole("combobox", { name: "Switch workspace", exact: true }),
  ).toHaveValue(
    role === "customer"
      ? "ws_cust_01"
      : role === "seller"
        ? "ws_sell_01"
        : "ws_adm_01",
  );
}
