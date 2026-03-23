"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useOrders(params?: {
  status?: string;
  tableId?: string;
  serverId?: string;
  date?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.tableId) searchParams.set("tableId", params.tableId);
  if (params?.serverId) searchParams.set("serverId", params.serverId);
  if (params?.date) searchParams.set("date", params.date);

  const query = searchParams.toString();
  const url = `/api/orders${query ? `?${query}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    refreshInterval: 10000,
  });

  return {
    orders: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useOrder(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/orders/${id}` : null,
    fetcher,
    { refreshInterval: 10000 }
  );

  return {
    order: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useActiveOrders() {
  return useOrders({ status: "ACTIVE" });
}

export function useOrderBill(orderId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    orderId ? `/api/orders/${orderId}/bill` : null,
    fetcher
  );

  return {
    bill: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}
