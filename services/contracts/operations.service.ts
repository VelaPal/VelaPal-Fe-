import * as dto from "./schemas";
import { apiValidated } from "@/lib/api";
export const operationsService = {
  get: (operationId: string) =>
    apiValidated(
      `/operations/${encodeURIComponent(operationId)}`,
      dto.operationDto,
    ),
  /** Reconcile existing operation ID only; never create a new financial intent. */
  reconcile: (operationId: string, key: string) =>
    apiValidated(
      `/operations/${encodeURIComponent(operationId)}/reconcile`,
      dto.operationDto,
      { method: "POST", idempotencyKey: key, body: {} },
    ),
};
