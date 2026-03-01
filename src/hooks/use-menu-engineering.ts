"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface MenuEngineeringItem {
  id: string;
  name: string;
  price: number;
  category: string | null;
  recipeName: string | null;
  recipeCost: number;
  foodCostPct: number;
  profitMargin: number;
  classification: "Star" | "Plow Horse" | "Puzzle" | "Dog";
}

export function useMenuEngineering() {
  const { data, error, isLoading, mutate } = useSWR<MenuEngineeringItem[]>(
    "/api/menu-engineering",
    fetcher
  );

  return {
    items: data ?? [],
    isLoading,
    isError: !!error,
    mutate,
  };
}
