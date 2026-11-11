import { test, expect, login } from "./api-fixture";

test("Admin frozen minimal investigation, assigned shared evidence, audit, transaction monitoring and unavailable administration", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page, "admin");
  await expect(
    page.getByRole("heading", { name: "A clear view of operations." }),
  ).toBeVisible();
  await page.goto("/workspace/admin/case_vp_0421");
  await expect(
    page.getByRole("button", { name: "Refresh investigation" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Evidence/ }).click();
  await expect(
    page.getByText("photo-label-128gb.jpg", { exact: true }),
  ).toBeVisible();
  await page.goto("/workspace/admin/audit");
  await expect(
    page.getByRole("heading", { name: "Audit logs & security" }),
  ).toBeVisible();
  await page.goto("/workspace/admin/transactions");
  await expect(
    page.getByRole("cell", {
      name: "No transactions match this view.",
      exact: true,
    }),
  ).toBeVisible();
  for (const route of ["users", "merchants", "ai", "analytics", "roles"]) {
    await page.goto("/workspace/admin/" + route);
    await expect(
      page.getByText("This feature is unavailable:", { exact: false }),
    ).toBeVisible();
  }
  await page.goto("/workspace/admin/settings");
  await expect(
    page.getByRole("button", { name: "Preview internal invitation" }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});
