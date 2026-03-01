"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function usePrepTasks(params?: {
  date?: string;
  status?: string;
  assignedToId?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.date) searchParams.set("date", params.date);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.assignedToId)
    searchParams.set("assignedToId", params.assignedToId);

  const query = searchParams.toString();
  const url = `/api/prep-tasks${query ? `?${query}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  return {
    tasks: data ?? [],
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function usePrepTask(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/prep-tasks/${id}` : null,
    fetcher
  );

  return {
    task: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}
