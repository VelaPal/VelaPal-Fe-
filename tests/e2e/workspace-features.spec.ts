import { test, expect, login } from "./api-fixture";

test("Customer unsupported features stay reachable with explicit unavailable states and no persisted business previews", async ({
  page,
}) => {
  await login(page, "customer");
  for (const route of [
    "subscriptions",
    "library",
    "notifications",
    "merchant-application",
  ]) {
    await page.goto("/workspace/" + route);
    await expect(
      page.getByText("This feature is unavailable:", { exact: false }),
    ).toBeVisible();
  }
  await page.goto("/workspace/settings");
  await expect(
    page.getByRole("button", { name: "Revoke other session" }),
  ).toBeDisabled();
  expect(
    await page.evaluate(() =>
      Object.keys(sessionStorage).filter((k) => k.startsWith("velapal:")),
    ),
  ).toEqual([]);
});

test("Seller orders, payments, catalog and case navigation use API records; unsupported mutations stay disabled", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page, "seller");
  await page.goto("/workspace/orders");
  await expect(
    page.getByText("tx_vp_1028", { exact: false }).first(),
  ).toBeVisible();
  await page.goto("/workspace/payments");
  await expect(
    page.getByText("tx_vp_1028", { exact: true }).first(),
  ).toBeVisible();
  await page.goto("/workspace/products");
  await expect(
    page.getByRole("heading", { name: "Pocket Drive", exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add product", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Edit details", exact: false }).first(),
  ).toBeDisabled();
  await page.goto("/workspace/assistant");
  await expect(
    page.getByRole("heading", { name: "Private Seller preparation" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("registration, verification and recovery never simulate account or credential success", async ({
  page,
}) => {
  await page.goto("/register");
  await expect(
    page.getByRole("button", { name: "Create personal account" }),
  ).toBeDisabled();
  await page.goto("/verify-email");
  await expect(
    page.getByRole("button", { name: "Verify email", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Resend verification link" }),
  ).toBeDisabled();
  await page.goto("/forgot-password");
  await expect(
    page.getByRole("button", { name: "Send recovery email" }),
  ).toBeDisabled();
  await page.goto("/reset-password");
  await expect(
    page.getByRole("button", { name: "Reset password", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(() =>
      Object.keys(sessionStorage).filter((k) => k.startsWith("velapal:")),
    ),
  ).toEqual([]);
});
