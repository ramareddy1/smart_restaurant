"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useRecipes(params?: { search?: string; category?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.category) searchParams.set("category", params.category);

  const query = searchParams.toString();
  const url = `/api/recipes${query ? `?${query}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  return {
    recipes: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useRecipe(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/recipes/${id}` : null,
    fetcher
  );

  return {
    recipe: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}
