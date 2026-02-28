"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useAlerts(params?: {
  type?: string;
  severity?: string;
  unreadOnly?: boolean;
}) {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set("type", params.type);
  if (params?.severity) searchParams.set("severity", params.severity);
  if (params?.unreadOnly) searchParams.set("unreadOnly", "true");

  const query = searchParams.toString();
  const url = `/api/alerts${query ? `?${query}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  return {
    alerts: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useUnreadAlertCount() {
  const { data, isLoading } = useSWR("/api/alerts?unreadOnly=true&pageSize=0", fetcher);

  return {
    count: data?.total ?? 0,
    isLoading,
  };
}
