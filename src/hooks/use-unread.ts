import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { QUERY_KEYS } from "@/constants/query-keys";

type UnreadData = {
  counts: Record<string, number>;
  total: number;
};

export function useUnreadCounts(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.unreadCounts(userId),
    queryFn: async (): Promise<UnreadData> => {
      const result: any = await client.queries.getUnreadCounts({});
      if (result?.data) {
        return {
          counts: JSON.parse(result.data.counts ?? "{}"),
          total: result.data.total ?? 0,
        };
      }
      return { counts: {}, total: 0 };
    },
    staleTime: 0,
    refetchInterval: 5000,
  });
}

export function useMarkAsRead(userId: string) {
  const queryClient = useQueryClient();

  return useCallback(async (chatId: string) => {
    try {
      await (client.mutations as any).markAsRead({ chatId });
    } catch (e) {
      console.error("markAsRead failed:", e);
    }
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unreadCounts(userId) });
    await queryClient.refetchQueries({ queryKey: QUERY_KEYS.unreadCounts(userId) });
  }, [userId, queryClient]);
}
