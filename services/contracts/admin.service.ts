import * as dto from "./schemas";
import { apiValidated } from "@/lib/api";
const id = encodeURIComponent;
export const adminService = {
  disputes: (
    filter:
      | "ALL"
      | "NEEDS_REVIEW"
      | "APPROVAL_REQUESTS"
      | "MANUAL"
      | "CLOSED" = "ALL",
    assignedToMe = false,
  ) =>
    apiValidated(
      `/admin/disputes?filter=${filter}&assignedToMe=${assignedToMe}`,
      dto.itemsDto(dto.adminCaseDto),
    ),
  detail: (caseId: string) =>
    apiValidated(`/admin/disputes/${id(caseId)}`, dto.adminDetailDto),
  assign: (caseId: string, reviewerId: string, reason: string) =>
    apiValidated(
      `/admin/disputes/${id(caseId)}/assignments`,
      dto.assignmentDto,
      {
        method: "POST",
        body: { reviewerId, reason, conflictDeclarationAccepted: true },
      },
    ),
  intervene: (
    caseId: string,
    controlVersion: number,
    action:
      | "PAUSE"
      | "RESUME"
      | "REQUEST_INVESTIGATION"
      | "ALLOW_VOLUNTARY_MEDIATION"
      | "SET_MANUAL"
      | "OFFICIAL_HANDOFF",
    reason: string,
    stepUpId: string,
  ) =>
    apiValidated(
      `/admin/disputes/${id(caseId)}/interventions`,
      dto.interventionDto,
      {
        method: "POST",
        ifMatch: controlVersion,
        body: { action, reason, stepUpId },
      },
    ),
  approvalRequests: () =>
    apiValidated("/admin/approval-requests", dto.itemsDto(dto.approvalDto)),
  decideApproval: (
    requestId: string,
    proposalVersion: number,
    body: {
      decision: "APPROVED" | "REJECTED";
      scope: string;
      paramsHash: string;
      caseVersion: number;
      stepUpId: string;
      reason: string;
    },
  ) =>
    apiValidated(
      `/admin/approval-requests/${id(requestId)}/decisions`,
      dto.approvalDecisionDto,
      {
        method: "POST",
        ifMatch: proposalVersion,
        body,
      },
    ),
  auditEvents: (caseId?: string) =>
    apiValidated(
      `/admin/audit-events${caseId ? `?caseId=${id(caseId)}` : ""}`,
      dto.itemsDto(dto.auditDto),
    ),
};
