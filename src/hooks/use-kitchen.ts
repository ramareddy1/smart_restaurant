"use client";

import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

// ─── Kitchen Dashboard ──────────────────────────────────────

export function useKitchenDashboard() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/kitchen/dashboard",
    fetcher,
    { refreshInterval: 30000 }
  );

  return { data, isLoading, isError: !!error, mutate };
}

// ─── Purchase Orders ────────────────────────────────────────

export function usePurchaseOrders(params?: {
  supplierId?: string;
  status?: string;
  page?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.supplierId) searchParams.set("supplierId", params.supplierId);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.page) searchParams.set("page", String(params.page));

  const query = searchParams.toString();
  const url = `/api/purchase-orders${query ? `?${query}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  return {
    orders: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function usePurchaseOrder(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/purchase-orders/${id}` : null,
    fetcher
  );

  return { order: data, isLoading, isError: !!error, mutate };
}

// ─── Low Stock Ingredients ──────────────────────────────────

export function useLowStockIngredients(supplierId?: string) {
  const params = supplierId ? `?lowStock=true&supplierId=${supplierId}` : "?lowStock=true";
  const { data, error, isLoading } = useSWR(
    `/api/purchase-orders${params}`,
    fetcher
  );

  return {
    ingredients: data?.items ?? [],
    isLoading,
    isError: !!error,
  };
}

// ─── Waste ──────────────────────────────────────────────────

export function useWasteData(days = 30) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/kitchen/waste?days=${days}`,
    fetcher
  );

  return {
    items: data?.items ?? [],
    stats: data?.stats ?? null,
    isLoading,
    isError: !!error,
    mutate,
  };
}

// ─── Usage Velocity ─────────────────────────────────────────

export function useUsageVelocity(days = 30) {
  const { data, error, isLoading } = useSWR(
    `/api/kitchen/usage-velocity?days=${days}`,
    fetcher
  );

  return {
    items: data?.items ?? [],
    isLoading,
    isError: !!error,
  };
}
