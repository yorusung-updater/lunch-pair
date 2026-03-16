"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { QUERY_KEYS } from "@/constants/query-keys";
import { formatDate } from "@/utils/date";
import { toast } from "sonner";
import Loading from "../Loading";

export default function MatchesPanel() {
  const queryClient = useQueryClient();
  const { data: matches, isLoading } = useQuery({
    queryKey: QUERY_KEYS.adminMatches,
    queryFn: async () => {
      const r: any = await client.models.Match.list({ limit: 1000 });
      return r?.data ?? [];
    },
  });

  async function deleteMatch(user1Id: string, user2Id: string) {
    if (!confirm("このマッチを削除しますか？")) return;
    try {
      await client.models.Match.delete({ user1Id, user2Id });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminMatches });
      toast.success("マッチを削除しました");
    } catch {
      toast.error("削除に失敗しました");
    }
  }

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">マッチ一覧</h2>
        <span className="text-sm text-gray-400">{matches?.length ?? 0}件</span>
      </div>
      <div className="space-y-2">
        {matches?.length === 0 && <p className="text-sm text-gray-400">まだマッチがありません</p>}
        {matches?.map((m: any) => (
          <div key={`${m.user1Id}-${m.user2Id}`} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-xs font-bold text-pink-600">
                  {(m.user1DisplayName || "?").charAt(0)}
                </div>
                <span className="text-sm font-medium truncate">{m.user1DisplayName || m.user1Id.slice(0, 8)}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#ec4899" stroke="none">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-xs font-bold text-pink-600">
                  {(m.user2DisplayName || "?").charAt(0)}
                </div>
                <span className="text-sm font-medium truncate">{m.user2DisplayName || m.user2Id.slice(0, 8)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">
                  {m.createdAt ? formatDate(m.createdAt) : ""}
                </span>
                <button
                  onClick={() => deleteMatch(m.user1Id, m.user2Id)}
                  className="rounded-full p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
