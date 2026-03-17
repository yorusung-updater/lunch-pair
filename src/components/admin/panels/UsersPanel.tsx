"use client";

import { useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { QUERY_KEYS } from "@/constants/query-keys";
import { toast } from "sonner";
import Loading from "../Loading";
import { useAdminUsers } from "@/hooks/admin/useAdminUsers";

export default function UsersPanel() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useAdminUsers();

  async function togglePackage(userId: string, field: "hasUnlimitedSwipe" | "hasLikesReveal", current: boolean) {
    try {
      await client.models.UserProfile.update({ userId, [field]: !current });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers });
      const name = field === "hasUnlimitedSwipe" ? "スワイプし放題" : "いいね見放題";
      toast.success(!current ? `${name}を有効化` : `${name}を解除`);
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
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-semibold text-sm truncate">{u.displayName}</p>
                  {u.hasUnlimitedSwipe && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-semibold text-blue-700">スワイプ∞</span>
                  )}
                  {u.hasLikesReveal && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-700">いいね👀</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">
                  {u.department || "部署未設定"} · {u.userId.slice(0, 8)}...
                </p>
              </div>
            </div>
            {/* Package toggles */}
            <div className="flex gap-2 mt-2.5 ml-13">
              <button
                onClick={() => togglePackage(u.userId, "hasUnlimitedSwipe", !!u.hasUnlimitedSwipe)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all active:scale-95 ${
                  u.hasUnlimitedSwipe
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {u.hasUnlimitedSwipe ? "スワイプ解除" : "スワイプ付与"}
              </button>
              <button
                onClick={() => togglePackage(u.userId, "hasLikesReveal", !!u.hasLikesReveal)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all active:scale-95 ${
                  u.hasLikesReveal
                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    : "bg-amber-500 text-white hover:bg-amber-600"
                }`}
              >
                {u.hasLikesReveal ? "いいね解除" : "いいね付与"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
