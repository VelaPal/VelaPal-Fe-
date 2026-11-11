import * as dto from "./schemas";
import type { AiPurpose } from "./types";
import { apiValidated } from "@/lib/api";
export const agentService = {
  start: (
    purpose: Exclude<AiPurpose, "SHARED_ASSESSMENT">,
    caseId: string | null,
    prompt: string,
  ) =>
    apiValidated("/agent/runs", dto.agentRunDto, {
      method: "POST",
      body: { purpose, caseId, prompt },
    }),
  get: (runId: string) =>
    apiValidated(`/agent/runs/${encodeURIComponent(runId)}`, dto.agentRunDto),
  // SHARED_ASSESSMENT is triggered through disputesService.assess, NOT POST /agent/runs.
};
