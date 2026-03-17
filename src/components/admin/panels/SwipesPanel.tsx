"use client";

import { formatDateTime } from "@/utils/date";
import Loading from "../Loading";
import { useAdminSwipes } from "@/hooks/admin/useAdminSwipes";
import { useAdminUsers } from "@/hooks/admin/useAdminUsers";

export default function SwipesPanel() {
  const { data: swipes, isLoading } = useAdminSwipes();

  // Build userId -> displayName map
  const { data: users } = useAdminUsers();

  const nameMap: Record<string, string> = {};
  users?.forEach((u: any) => { nameMap[u.userId] = u.displayName; });

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">スワイプ履歴</h2>
        <span className="text-sm text-gray-400">{swipes?.length ?? 0}件</span>
      </div>
      <div className="space-y-1.5">
        {swipes?.length === 0 && <p className="text-sm text-gray-400">まだスワイプがありません</p>}
        {swipes?.map((s: any, i: number) => (
          <div key={`${s.swiperId}-${s.targetId}-${i}`} className="rounded-lg bg-white px-4 py-2.5 shadow-sm flex items-center gap-2 text-sm">
            <span className="font-medium truncate max-w-[100px]">
              {nameMap[s.swiperId] || s.swiperId.slice(0, 8)}
            </span>
            <span className="text-gray-400">{"\u2192"}</span>
            {s.direction === "OK" ? (
              <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-semibold text-pink-600">いいかも</span>
            ) : (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">また今度</span>
            )}
            <span className="text-gray-400">{"\u2192"}</span>
            <span className="font-medium truncate max-w-[100px]">
              {nameMap[s.targetId] || s.targetId.slice(0, 8)}
            </span>
            <span className="ml-auto text-[10px] text-gray-300">
              {s.createdAt ? formatDateTime(s.createdAt) : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
