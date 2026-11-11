import fs from "node:fs";
import { test, expect, login } from "./api-fixture";

test("Customer session recovery, authorized purchases, quotes, protected routes and responsive shell", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/workspace/cases");
  await expect(page).toHaveURL("/login");
  await login(page, "customer");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your overview", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('a[href="/workspace/transactions/tx_vp_1028"]').first(),
  ).toBeVisible();
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/workspace/cases/case_vp_0421");
    await expect(
      page.getByRole("heading", { name: "case_vp_0421", exact: true }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.screenshot({
      path: "test-results/api-customer-" + width + ".png",
      fullPage: true,
    });
  }
  await page.goto("/workspace/catalog");
  await page.getByRole("button", { name: /256GB.*59.00/ }).click();
  await page.getByLabel("Spending limit", { exact: false }).fill("100.00");
  await page.getByRole("button", { name: "Get quote", exact: true }).click();
  await expect(page.getByText("READY", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Review checkout", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Continue to provider approval" }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await page.goto("/workspace/settings");
  await page
    .locator("#main-content")
    .getByRole("button", { name: "Sign out", exact: true })
    .click();
  await expect(page).toHaveURL("/login");
  expect(errors).toEqual([]);
});

test("API dispute creation uses idempotency and preserves private/shared versions", async ({
  page,
}) => {
  await login(page, "customer");
  await page.goto("/workspace/cases/new");
  await page
    .getByRole("combobox", { name: "Transaction or order", exact: true })
    .selectOption("tx_demo_unconfirmed_0422");
  await page
    .getByRole("combobox", { name: "Reason for this report", exact: true })
    .selectOption("CONTESTED_CLAIM");
  await page
    .getByLabel("Your account of events")
    .fill("The payment needs clarification before this order can proceed.");
  await page.getByRole("checkbox").check();
  const request = page.waitForRequest(
    (r) => r.url().endsWith("/api/v1/disputes") && r.method() === "POST",
  );
  await page.getByRole("button", { name: "Submit dispute" }).click();
  const submitted = await request;
  expect(submitted.headers()["idempotency-key"]).toBeTruthy();
  await expect(page).toHaveURL(/\/workspace\/cases\/case_/);
  await page.getByRole("button", { name: "Discussion", exact: true }).click();
  await page
    .getByLabel("Message", { exact: true })
    .fill("This is a private preparation note.");
  await page
    .getByRole("button", { name: "Save private note", exact: true })
    .click();
  await expect(
    page.getByText("This is a private preparation note.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Mediation & consent", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Create proposal", exact: true }),
  ).toBeDisabled();
});

test("backend outage shows an error and cannot fall back to business records or successful login", async ({
  page,
  context,
}) => {
  await context.unroute("**/api/v1/**");
  await context.route("**/api/v1/**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Backend unavailable",
          traceId: "outage",
          retryable: true,
          fieldErrors: {},
        },
      }),
    }),
  );
  await page.goto("/workspace");
  await expect(
    page.getByRole("alert").filter({ hasText: "Backend unavailable" }),
  ).toContainText("Backend unavailable");
  await expect(page.getByText("Pocket Drive", { exact: true })).toHaveCount(0);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("someone@example.test");
  await page.getByLabel("Password", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Backend unavailable" }),
  ).toContainText("Backend unavailable");
  await expect(page).toHaveURL("/login");
});

test("settlement acknowledgment resets for changed terms and execution requires every distinct consent", async ({
  page,
}) => {
  await login(page, "seller");
  const examples = [
    ...fs
      .readFileSync("velapal-v6.1-api-contract.md", "utf8")
      .matchAll(/```json\s*([\s\S]*?)```/g),
  ].flatMap((m) => {
    try {
      return [JSON.parse(m[1])];
    } catch {
      return [];
    }
  });
  const response = structuredClone(
    examples.find((x) => x.data?.activeProposal),
  );
  response.data.activeProposal.expiresAt = new Date(
    Date.now() + 3600000,
  ).toISOString();
  response.data.case.capabilities.canExecuteSettlement = true;
  response.data.pendingConsents = [];
  await page.route("**/api/v1/disputes/case_vp_0421", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response),
    }),
  );
  await page.goto("/workspace/cases/case_vp_0421");
  await page
    .getByRole("button", { name: "Mediation & consent", exact: true })
    .click();
  const accept = page.getByRole("button", {
    name: "Accept proposal terms",
    exact: true,
  });
  const execute = page.getByRole("button", {
    name: "Submit authorized settlement",
    exact: true,
  });
  await expect(accept).toBeDisabled();
  await expect(execute).toBeDisabled();
  const acknowledgment = page.getByRole("checkbox").last();
  await acknowledgment.check();
  await expect(accept).toBeEnabled();
  response.data.activeProposal.terms =
    "Updated exact settlement terms require another review.";
  response.data.activeProposal.proposalVersion = 2;
  response.data.activeProposal.paramsHash = "test-updated-binding";
  await page.getByRole("button", { name: "Refresh latest case" }).click();
  await expect(
    page.getByText(response.data.activeProposal.terms, { exact: true }),
  ).toBeVisible();
  await expect(acknowledgment).not.toBeChecked();
  await expect(accept).toBeDisabled();
  response.data.pendingConsents = [
    {
      party: "CUSTOMER",
      intent: "ACCEPT_PROPOSAL_TERMS",
      status: "APPROVED",
      approvedAt: new Date().toISOString(),
    },
    {
      party: "SELLER",
      intent: "ACCEPT_PROPOSAL_TERMS",
      status: "APPROVED",
      approvedAt: new Date().toISOString(),
    },
  ];
  await page.getByRole("button", { name: "Refresh latest case" }).click();
  await expect(execute).toBeDisabled();
  response.data.pendingConsents.push({
    party: "SELLER",
    intent: "AUTHORIZE_FINANCIAL_EXECUTION",
    status: "APPROVED",
    approvedAt: new Date().toISOString(),
  });
  response.data.providerOperation.status = "UNKNOWN";
  await page.getByRole("button", { name: "Refresh latest case" }).click();
  await expect(execute).toBeDisabled();
});
