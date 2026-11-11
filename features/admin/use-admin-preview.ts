"use client";
import type { AdminPreview, PreviewAction } from "./admin-preview";
// No public administration endpoints exist for these screens in the frozen contract.
const unavailable: AdminPreview = {
  users: [],
  merchants: [],
  aiEnabled: false,
  permissions: [],
  otherSessionRevoked: false,
  invitations: [],
  audit: [],
};
export function useAdminPreview() {
  return {
    state: unavailable,
    enabled: false,
    commit: (_action: PreviewAction, _reason: string, _code: string): never => {
      void _action;
      void _reason;
      void _code;
      throw new Error(
        "This administrative action has no defined backend endpoint.",
      );
    },
    reset: (): never => {
      throw new Error("There are no local administrative records to reset.");
    },
  };
}
