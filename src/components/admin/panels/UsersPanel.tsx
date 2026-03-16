"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { QUERY_KEYS } from "@/constants/query-keys";
import { toast } from "sonner";
import Loading from "../Loading";

export default function UsersPanel() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: QUERY_KEYS.adminUsers,
    queryFn: async () => {
      const r: any = await client.models.UserProfile.list({ limit: 1000 });
      return r?.data ?? [];
    },
  });

  async function togglePremium(userId: string, current: boolean) {
    try {
      await client.models.UserProfile.update({ userId, isPremium: !current });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers });
      toast.success(!current ? "プレミアム有効化" : "プレミアム無効化");
    } catch {
      toast.error("更新に失敗しました");
    }
  }

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">ユーザー一覧</h2>
        <span className="text-sm text-gray-400">{users?.length ?? 0}名</span>
      </div>
      <div className="space-y-2">
        {users?.map((u: any) => (
          <div key={u.userId} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600 text-sm">
                {(u.displayName || "?").charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{u.displayName}</p>
                  {u.isPremium && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">PRO</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">
                  {u.department || "部署未設定"} · {u.userId.slice(0, 8)}...
                </p>
              </div>
              <button
                onClick={() => togglePremium(u.userId, !!u.isPremium)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                  u.isPremium
                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    : "bg-amber-500 text-white hover:bg-amber-600"
                }`}
              >
                {u.isPremium ? "PRO解除" : "PRO付与"}
              </button>
            </div>
            {u.preferences && u.preferences.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 ml-13">
                {u.preferences.slice(0, 5).map((p: string) => p && (
                  <span key={p} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">{p}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
