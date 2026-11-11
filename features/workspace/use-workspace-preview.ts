"use client";
import { useSession } from "@/features/auth/session";
import type { WorkspacePreview, WorkspacePreviewAction } from "./preview-state";
// These features have no public endpoint in the frozen contract. Never seed or persist records.
const unavailable: WorkspacePreview = {
  version: 1,
  defaultLimitMinor: 0,
  remindersEnabled: false,
  subscription: {
    status: "Cancelled",
    billingAt: "",
    accessUntil: "",
    reminder: "pending",
    snoozedUntil: null,
  },
  notificationsRead: true,
  otherSessionRevoked: false,
  business: {
    name: "",
    website: "",
    category: "",
    country: "",
    status: "Pending",
    reviewNote: "Unavailable",
  },
  products: [],
  fulfilment: {},
  history: [],
};
export function useWorkspacePreview() {
  const { session } = useSession();
  return {
    state: unavailable,
    enabled: false,
    role: session?.activeWorkspace.type,
    commit: (_action: WorkspacePreviewAction): never => {
      void _action;
      throw new Error(
        "This feature is unavailable until its backend endpoint is defined.",
      );
    },
    reset: (): never => {
      throw new Error("There are no local business records to reset.");
    },
  };
}
