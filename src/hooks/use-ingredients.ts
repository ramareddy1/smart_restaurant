"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useIngredients(params?: {
  search?: string;
  category?: string;
  lowStock?: boolean;
}) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.category) searchParams.set("category", params.category);
  if (params?.lowStock) searchParams.set("lowStock", "true");

  const query = searchParams.toString();
  const url = `/api/ingredients${query ? `?${query}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  return {
    ingredients: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useIngredient(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/ingredients/${id}` : null,
    fetcher
  );

  return {
    ingredient: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useAllIngredients() {
  const { data, error, isLoading } = useSWR("/api/ingredients?pageSize=1000", fetcher);

  return {
    ingredients: data?.items ?? [],
    isLoading,
    isError: !!error,
  };
}
