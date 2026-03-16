"use client";

import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { QUERY_KEYS } from "@/constants/query-keys";
import { formatDate } from "@/utils/date";

export default function StatsPanel() {
  const { data: users } = useQuery({
    queryKey: QUERY_KEYS.adminUsers,
    queryFn: async () => {
      const r: any = await client.models.UserProfile.list({ limit: 1000 });
      return r?.data ?? [];
    },
  });
  const { data: matches } = useQuery({
    queryKey: QUERY_KEYS.adminMatches,
    queryFn: async () => {
      const r: any = await client.models.Match.list({ limit: 1000 });
      return r?.data ?? [];
    },
  });
  const { data: swipes } = useQuery({
    queryKey: QUERY_KEYS.adminSwipes,
    queryFn: async () => {
      const r: any = await client.models.Swipe.list({ limit: 1000 });
      return r?.data ?? [];
    },
  });

  const totalUsers = users?.length ?? 0;
  const premiumUsers = users?.filter((u: any) => u.isPremium).length ?? 0;
  const totalMatches = matches?.length ?? 0;
  const totalSwipes = swipes?.length ?? 0;
  const okSwipes = swipes?.filter((s: any) => s.direction === "OK").length ?? 0;
  const skipSwipes = totalSwipes - okSwipes;
  const matchRate = totalSwipes > 0 ? ((totalMatches * 2) / okSwipes * 100).toFixed(1) : "0";

  const stats = [
    { label: "総ユーザー数", value: totalUsers, icon: "👥", color: "bg-blue-50 text-blue-700" },
    { label: "プレミアム会員", value: premiumUsers, icon: "⭐", color: "bg-amber-50 text-amber-700" },
    { label: "総マッチ数", value: totalMatches, icon: "💑", color: "bg-pink-50 text-pink-700" },
    { label: "総スワイプ数", value: totalSwipes, icon: "👆", color: "bg-green-50 text-green-700" },
    { label: "いいかも率", value: `${totalSwipes > 0 ? (okSwipes / totalSwipes * 100).toFixed(0) : 0}%`, icon: "❤️", color: "bg-rose-50 text-rose-700" },
    { label: "マッチ率", value: `${matchRate}%`, icon: "🎯", color: "bg-purple-50 text-purple-700" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">ダッシュボード</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 ${s.color}`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{s.icon}</span>
              <span className="text-2xl font-bold">{s.value}</span>
            </div>
            <p className="text-xs mt-1 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">最近のマッチ</h3>
        {matches && matches.length > 0 ? (
          <div className="space-y-2">
            {matches.slice(0, 5).map((m: any) => (
              <div key={`${m.user1Id}-${m.user2Id}`} className="flex items-center gap-2 text-sm">
                <span className="text-pink-500">💑</span>
                <span className="font-medium">{m.user1DisplayName || m.user1Id.slice(0, 8)}</span>
                <span className="text-gray-400">×</span>
                <span className="font-medium">{m.user2DisplayName || m.user2Id.slice(0, 8)}</span>
                <span className="ml-auto text-xs text-gray-400">
                  {m.createdAt ? formatDate(m.createdAt) : ""}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">まだマッチがありません</p>
        )}
      </div>
    </div>
  );
}
