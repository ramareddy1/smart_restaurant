"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useAllergens() {
  const { data, error, isLoading } = useSWR("/api/allergens", fetcher);

  return {
    allergens: data ?? [],
    isLoading,
    isError: !!error,
  };
}

export function useIngredientAllergens(ingredientId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    ingredientId ? `/api/ingredients/${ingredientId}/allergens` : null,
    fetcher
  );

  return {
    allergens: data ?? [],
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useMenuItemAllergens(menuItemId: string | null) {
  const { data, error, isLoading } = useSWR(
    menuItemId ? `/api/menu-items/${menuItemId}/allergens` : null,
    fetcher
  );

  return {
    allergens: data ?? [],
    isLoading,
    isError: !!error,
  };
}
