"use client";

import useSWR from "swr";
import { getOverviewSummary } from "@/services/overview.service";
import type { OverviewSummaryData } from "@/features/overview/types";

export function useOverview() {
  const mode = process.env.NEXT_PUBLIC_API_MODE;

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<OverviewSummaryData, Error>(["overview", mode],
    () => getOverviewSummary(),
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    },
  );

  return {
    summary: data,
    error,
    isLoading,
    isRefreshing: isValidating,
    refresh: () => mutate(),
  };
}