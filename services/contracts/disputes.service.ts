import * as dto from "./schemas";
import { apiValidated, uploadToHandle } from "@/lib/api";
import type {
  ConsentIntent,
  DisputeCategory,
  SourceRef,
  SettlementRoute,
} from "./types";
const id = encodeURIComponent;
export const disputesService = {
  list: () => apiValidated("/disputes", dto.itemsDto(dto.caseListItemDto)),
  get: (caseId: string) =>
    apiValidated(`/disputes/${id(caseId)}`, dto.disputeDetailDto),
  create: (
    body: {
      transactionId: string | null;
      orderId: string | null;
      category: DisputeCategory;
      statement: string;
      audience: "CASE_SHARED";
    },
    key: string,
  ) =>
    apiValidated("/disputes", dto.caseCreatedDto, {
      method: "POST",
      body,
      idempotencyKey: key,
    }),
  message: (
    caseId: string,
    body: {
      text: string;
      sourceRefs: SourceRef[];
      audience: "PRIVATE" | "CASE_SHARED";
    },
    version: number,
  ) =>
    apiValidated(`/disputes/${id(caseId)}/messages`, dto.messageCreatedDto, {
      method: "POST",
      body,
      ifMatch: version,
    }),
  uploadIntent: (
    caseId: string,
    body: { mime: string; byteCount: number; originalName: string },
  ) =>
    apiValidated(
      `/disputes/${id(caseId)}/sources/upload-intents`,
      dto.uploadIntentDto,
      {
        method: "POST",
        body,
      },
    ),
  /** Backend-issued storage handle only; no cookies or CSRF leave the public API. */
  uploadBytes: uploadToHandle,
  finalize: (
    caseId: string,
    sourceId: string,
    uploadId: string,
    sourceVersion: number,
  ) =>
    apiValidated(
      `/disputes/${id(caseId)}/sources/${id(sourceId)}/finalize`,
      dto.finalizedSourceDto,
      { method: "POST", body: { uploadId }, ifMatch: sourceVersion },
    ),
  getSource: (caseId: string, sourceId: string) =>
    apiValidated(
      `/disputes/${id(caseId)}/sources/${id(sourceId)}`,
      dto.sourceDto,
    ),
  shareSource: (
    caseId: string,
    sourceId: string,
    sourceVersion: number,
    audience: "CASE_SHARED" | "PROVIDER_SHARED",
    paramsHash: string,
  ) =>
    apiValidated(
      `/disputes/${id(caseId)}/sources/${id(sourceId)}/share`,
      dto.sourceChangeDto,
      {
        method: "POST",
        ifMatch: sourceVersion,
        body: {
          audience,
          consentIntent: "SHARE_SOURCE" satisfies ConsentIntent,
          paramsHash,
        },
      },
    ),
  revokeSource: (
    caseId: string,
    sourceId: string,
    sourceVersion: number,
    reason: string,
  ) =>
    apiValidated(
      `/disputes/${id(caseId)}/sources/${id(sourceId)}/revoke`,
      dto.sourceChangeDto,
      {
        method: "POST",
        ifMatch: sourceVersion,
        body: { reason },
      },
    ),
  assess: (caseId: string, caseVersion: number) =>
    apiValidated(
      `/disputes/${id(caseId)}/assessments`,
      dto.assessmentQueuedDto,
      {
        method: "POST",
        body: {},
        ifMatch: caseVersion,
      },
    ),
  mediationConsent: (
    caseId: string,
    caseVersion: number,
    assessmentRunId: string,
    paramsHash: string,
    decision: "APPROVED" | "REJECTED",
  ) =>
    apiValidated(
      `/disputes/${id(caseId)}/mediation-consents`,
      dto.mediationConsentDto,
      {
        method: "POST",
        ifMatch: caseVersion,
        body: {
          consentIntent: "CONTINUE_MEDIATION",
          assessmentRunId,
          paramsHash,
          decision,
        },
      },
    ),
  propose: (
    caseId: string,
    caseVersion: number,
    body: {
      terms: string;
      money: { amountMinor: number; currency: "USD" };
      route: SettlementRoute;
      sourceDigest: string;
      expiresInMinutes: number;
    },
  ) =>
    apiValidated(`/disputes/${id(caseId)}/proposals`, dto.proposalCreatedDto, {
      method: "POST",
      ifMatch: caseVersion,
      body,
    }),
  requestReview: (
    caseId: string,
    body: {
      reason: string;
      contestedFindingIds: string[];
      newSourceRefs: SourceRef[];
    },
  ) =>
    apiValidated(`/disputes/${id(caseId)}/reviews`, dto.reviewCreatedDto, {
      method: "POST",
      body,
    }),
  grantConsent: (
    actionRequestId: string,
    proposalVersion: number,
    body: {
      paramsHash: string;
      caseVersion: number;
      intent: "ACCEPT_PROPOSAL_TERMS" | "AUTHORIZE_FINANCIAL_EXECUTION";
      decision: "APPROVED" | "REJECTED";
      stepUpId: string | null;
    },
  ) =>
    apiValidated(
      `/action-requests/${id(actionRequestId)}/consents`,
      dto.consentDto,
      {
        method: "POST",
        ifMatch: proposalVersion,
        body,
      },
    ),
  execute: (
    actionRequestId: string,
    caseVersion: number,
    paramsHash: string,
    key: string,
  ) =>
    apiValidated(
      `/action-requests/${id(actionRequestId)}/execute`,
      dto.executionDto,
      {
        method: "POST",
        ifMatch: caseVersion,
        idempotencyKey: key,
        body: { paramsHash },
      },
    ),
};
