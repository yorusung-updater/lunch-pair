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
    refetchInterval: 10000, // 10秒ごとにポーリング
  });
}

export function useMarkAsRead(userId: string) {
  const queryClient = useQueryClient();

  return async (chatId: string) => {
    const now = new Date().toISOString();
    try {
      // Try update first (existing record)
      await client.models.ChatReadStatus.update({
        chatId,
        userId,
        lastReadAt: now,
      });
    } catch {
      // Record doesn't exist yet — create it
      try {
        await client.models.ChatReadStatus.create({
          chatId,
          userId,
          lastReadAt: now,
        });
      } catch {
        // Ignore — race condition or permission issue
      }
    }
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unreadCounts(userId) });
  };
}
