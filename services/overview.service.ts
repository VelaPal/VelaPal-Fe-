import {getJson} from "@/lib/http-client";
import {overviewMock} from "@/features/overview/data/overview.mock"; 
import {dashboardResponseSchema, overviewSummarySchema} from "@/features/overview/schemas";

import type {OverviewSummaryData} from "@/features/overview/types"; 

export async function getOverviewSummary(): Promise<OverviewSummaryData> {
    const mode = process.env.NEXT_PUBLIC_API_MODE;

    if (mode === "mock") { 
        return overviewSummarySchema.parse(overviewMock);
    }

    if (mode === "api") { 
        throw new Error("NEXT_PUBLIC_API_MODE diatur ke 'api', tetapi implementasi API belum tersedia.");
    }

    const response = await getJson("/dashboard");
    const result = dashboardResponseSchema.safeParse(response);

    if (!result.success) {
        throw new Error("Failed to parse dashboard response.");
    }

    return result.data.summary;
}

