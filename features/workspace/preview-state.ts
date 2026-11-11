/** View types for screens awaiting endpoints. Test fixtures live under tests/fixtures. */
export type PreviewProduct = {
  id: string;
  name: string;
  variant: string;
  sku: string;
  type: "physical" | "digital" | "subscription";
  amountMinor: number;
  status: "Published" | "Archived" | "Read only";
};
export type WorkspacePreview = {
  version: 1;
  defaultLimitMinor: number;
  remindersEnabled: boolean;
  subscription: {
    status: "Active" | "Cancelled";
    billingAt: string;
    accessUntil: string;
    reminder: "pending" | "kept" | "snoozed";
    snoozedUntil: string | null;
  };
  notificationsRead: boolean;
  otherSessionRevoked: boolean;
  business: {
    name: string;
    website: string;
    category: string;
    country: string;
    status: "Pending" | "Approved" | "Rejected";
    reviewNote: string;
  };
  products: PreviewProduct[];
  fulfilment: Record<
    string,
    { status: "Shipped" | "Delivered"; tracking: string }
  >;
  history: { action: string; target: string; at: string }[];
};
export type WorkspacePreviewAction =
  | { kind: "limit"; amountMinor: number }
  | { kind: "reminders"; enabled: boolean }
  | { kind: "keep" }
  | { kind: "snooze" }
  | { kind: "cancel"; consent: boolean; reason: string }
  | { kind: "read-notifications" }
  | { kind: "revoke-sample" }
  | { kind: "profile"; name: string; website: string }
  | {
      kind: "application";
      name: string;
      website: string;
      category: string;
      country: string;
    }
  | { kind: "application-state"; status: "Pending" | "Approved" | "Rejected" }
  | { kind: "product"; product: PreviewProduct }
  | { kind: "archive"; id: string }
  | {
      kind: "fulfilment";
      paymentStatus: string;
      orderId: string;
      status: "Shipped" | "Delivered";
      tracking: string;
      consent: boolean;
    };
export function moneyFromDollars(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim()))
    throw new Error(
      "Use a nonnegative USD amount with at most two decimal places.",
    );
  const [whole, fraction = ""] = value.trim().split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(amount)) throw new Error("Amount is too large.");
  return amount;
}
