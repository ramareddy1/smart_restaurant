"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useSuppliers(params?: { search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);

  const query = searchParams.toString();
  const url = `/api/suppliers${query ? `?${query}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  return {
    suppliers: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useSupplier(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/suppliers/${id}` : null,
    fetcher
  );

  return {
    supplier: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useAllSuppliers() {
  const { data, error, isLoading } = useSWR("/api/suppliers?pageSize=1000", fetcher);

  return {
    suppliers: data?.items ?? [],
    isLoading,
    isError: !!error,
  };
}
