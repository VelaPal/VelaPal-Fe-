import * as dto from "./schemas";
import { apiData, apiValidated, clearCsrfToken, setCsrfToken } from "@/lib/api";
import type { AuthenticatedSession, LoginResponse } from "./types";
const isAuthenticated = (r: LoginResponse): r is AuthenticatedSession =>
  r.status === "AUTHENTICATED";
export const authService = {
  async login(email: string, password: string) {
    const r = await apiValidated("/auth/login", dto.loginDto, {
      method: "POST",
      body: { email, password },
    });
    if (isAuthenticated(r)) setCsrfToken(r.csrfToken);
    return r;
  },
  async restoreSession(signal?: AbortSignal) {
    const s = await apiValidated("/auth/session", dto.sessionDto, { signal });
    return s;
  },
  async logout() {
    await apiData<void>("/auth/logout", { method: "POST" });
    clearCsrfToken();
  },
  createMfaChallenge(
    purpose:
      | "ADMIN_INTERVENTION"
      | "ADMIN_APPROVAL"
      | "WORKSPACE_SWITCH"
      | "MERCHANT_EXECUTION",
    targetId: string,
  ) {
    return apiValidated("/auth/mfa/challenges", dto.stepUpChallengeDto, {
      method: "POST",
      body: { purpose, targetId },
    });
  },
  async verifyMfa(challengeId: string, code: string) {
    const data = await apiValidated("/auth/mfa/verify", dto.mfaDto, {
      method: "POST",
      body: { challengeId, code },
    });
    if (data.status === "AUTHENTICATED") setCsrfToken(data.csrfToken);
    return data;
  },
  listWorkspaces() {
    return apiValidated("/me/workspaces", dto.itemsDto(dto.workspaceDto));
  },
  async switchWorkspace(workspaceId: string, stepUpId: string | null = null) {
    const r = await apiValidated("/session/workspace", dto.switchWorkspaceDto, {
      method: "POST",
      body: { workspaceId, stepUpId },
    });
    setCsrfToken(r.csrfToken);
    // UI MUST cancel old workspace requests and invalidate all scoped query caches.
    return r;
  },
};
