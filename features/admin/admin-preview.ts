/** View types for unavailable administration features. No local grants or records. */
export type PreviewUser = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  status: "Active" | "Suspended";
  verified: boolean;
};
export type PreviewMerchant = {
  id: string;
  name: string;
  owner: string;
  email: string;
  category: string;
  country: string;
  website: string;
  status: "Pending" | "Approved" | "Rejected";
  note: string;
};
export type PreviewAudit = {
  id: string;
  at: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  reason: string;
};
export type AdminPreview = {
  users: PreviewUser[];
  merchants: PreviewMerchant[];
  aiEnabled: boolean;
  permissions: string[];
  otherSessionRevoked: boolean;
  invitations: string[];
  audit: PreviewAudit[];
};
export const staffPermissions = [
  "transactions.read",
  "disputes.read",
  "audit.read",
  "analytics.read",
];
export type PreviewAction =
  | { kind: "user"; id: string; status: "Active" | "Suspended" }
  | { kind: "merchant"; id: string; status: "Approved" | "Rejected" }
  | { kind: "ai"; enabled: boolean }
  | { kind: "permissions"; permissions: string[] }
  | { kind: "invite"; email: string }
  | { kind: "revoke-session" };
