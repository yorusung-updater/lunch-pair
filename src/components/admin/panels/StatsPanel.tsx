"use client";

import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { QUERY_KEYS } from "@/constants/query-keys";
import { formatDate } from "@/utils/date";
import { useEffect, useState } from "react";

function StatsPanelContent() {
  const { data: users, error: usersError, isLoading: usersLoading } = useQuery({
    queryKey: QUERY_KEYS.adminUsers,
    queryFn: async () => {
      try {
        const r: any = await client.models.UserProfile?.list?.({ limit: 1000 });
        return r?.data ?? [];
      } catch (err) {
        console.error("Error loading users:", err);
        throw err;
      }
    },
    retry: 1,
  });
  const { data: matches, error: matchesError, isLoading: matchesLoading } = useQuery({
    queryKey: QUERY_KEYS.adminMatches,
    queryFn: async () => {
      try {
        const r: any = await client.models.Match?.list?.({ limit: 1000 });
        return r?.data ?? [];
      } catch (err) {
        console.error("Error loading matches:", err);
        throw err;
      }
    },
    retry: 1,
  });
  const { data: swipes, error: swipesError, isLoading: swipesLoading } = useQuery({
    queryKey: QUERY_KEYS.adminSwipes,
    queryFn: async () => {
      try {
        const r: any = await client.models.Swipe?.list?.({ limit: 1000 });
        return r?.data ?? [];
      } catch (err) {
        console.error("Error loading swipes:", err);
        throw err;
      }
    },
    retry: 1,
  });

  if (usersLoading || matchesLoading || swipesLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>
    );
  }

  if (usersError || matchesError || swipesError) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600">データの読み込みに失敗しました</p>
        {usersError && <p className="text-xs text-red-400 mt-1">Users: {usersError instanceof Error ? usersError.message : "Error"}</p>}
        {matchesError && <p className="text-xs text-red-400 mt-1">Matches: {matchesError instanceof Error ? matchesError.message : "Error"}</p>}
        {swipesError && <p className="text-xs text-red-400 mt-1">Swipes: {swipesError instanceof Error ? swipesError.message : "Error"}</p>}
      </div>
    );
  }

  const totalUsers = users?.length ?? 0;
  const swipePackUsers = users?.filter((u: any) => u.hasUnlimitedSwipe).length ?? 0;
  const likesPackUsers = users?.filter((u: any) => u.hasLikesReveal).length ?? 0;
  const totalMatches = matches?.length ?? 0;
  const totalSwipes = swipes?.length ?? 0;
  const okSwipes = swipes?.filter((s: any) => s.direction === "OK").length ?? 0;
  const matchRate = okSwipes > 0 ? ((totalMatches * 2) / okSwipes * 100).toFixed(1) : "0";

  const stats = [
    { label: "総ユーザー数", value: totalUsers, icon: "👥", color: "bg-blue-50 text-blue-700" },
    { label: "スワイプし放題", value: swipePackUsers, icon: "🔄", color: "bg-indigo-50 text-indigo-700" },
    { label: "いいね見放題", value: likesPackUsers, icon: "👀", color: "bg-amber-50 text-amber-700" },
    { label: "総マッチ数", value: totalMatches, icon: "💑", color: "bg-pink-50 text-pink-700" },
    { label: "総スワイプ数", value: totalSwipes, icon: "👆", color: "bg-green-50 text-green-700" },
    { label: "いいかも率", value: `${totalSwipes > 0 ? (okSwipes / totalSwipes * 100).toFixed(0) : 0}%`, icon: "❤️", color: "bg-rose-50 text-rose-700" },
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

export default function StatsPanel() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>
    );
  }

  return <StatsPanelContent />;
}
