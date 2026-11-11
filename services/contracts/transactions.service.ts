import { apiValidated, ApiError } from "@/lib/api";
import * as dto from "./schemas";
export const transactionsService = {
  list: (signal?: AbortSignal) =>
    apiValidated("/transactions", dto.itemsDto(dto.transactionDto), { signal }),
  get: (id: string, signal?: AbortSignal) =>
    apiValidated(
      `/transactions/${encodeURIComponent(id)}`,
      dto.transactionDetailDto,
      { signal },
    ),
  catalog: (signal?: AbortSignal) =>
    apiValidated("/catalog", dto.catalogDto, { signal }),
  quote: (request: {
    productId: string;
    variantId: string;
    quantity: number;
    spendingLimitMinor: number;
  }) =>
    apiValidated("/quotes", dto.quoteDto, { method: "POST", body: request }),
  // ?3.8 names these endpoints but omits the request/approval DTOs. Do not send arbitrary financial payloads.
  createCheckoutOrder: async (): Promise<never> => {
    throw new ApiError(
      0,
      "INTEGRATION_UNAVAILABLE",
      "Checkout request and provider approval schemas are not defined in the frozen contract.",
      "",
      false,
    );
  },
  captureCheckoutOrder: async (): Promise<never> => {
    throw new ApiError(
      0,
      "INTEGRATION_UNAVAILABLE",
      "Checkout capture is unavailable until its approval handoff is defined.",
      "",
      false,
    );
  },
};
