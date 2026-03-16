"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/types/schema";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

const client = generateClient<Schema>();
const queryClient = new QueryClient();

type Tab = "users" | "matches" | "swipes" | "stats";

export default function AdminDashboard() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminContent />
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}

function AdminContent() {
  const [tab, setTab] = useState<Tab>("stats");

  const tabs: { id: Tab; label: string }[] = [
    { id: "stats", label: "概要" },
    { id: "users", label: "ユーザー" },
    { id: "matches", label: "マッチ" },
    { id: "swipes", label: "スワイプ" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <h1 className="font-bold text-gray-900">Lunch Pair 管理画面</h1>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem("admin-auth");
              window.location.reload();
            }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            ログアウト
          </button>
        </div>
        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4 flex gap-0.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {tab === "stats" && <StatsPanel />}
        {tab === "users" && <UsersPanel />}
        {tab === "matches" && <MatchesPanel />}
        {tab === "swipes" && <SwipesPanel />}
      </div>
    </div>
  );
}

// ===== Stats =====
function StatsPanel() {
  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const r: any = await client.models.UserProfile.list({ limit: 1000 });
      return r?.data ?? [];
    },
  });
  const { data: matches } = useQuery({
    queryKey: ["admin-matches"],
    queryFn: async () => {
      const r: any = await client.models.Match.list({ limit: 1000 });
      return r?.data ?? [];
    },
  });
  const { data: swipes } = useQuery({
    queryKey: ["admin-swipes"],
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
                  {m.createdAt ? new Date(m.createdAt).toLocaleDateString("ja-JP") : ""}
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

// ===== Users =====
function UsersPanel() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const r: any = await client.models.UserProfile.list({ limit: 1000 });
      return r?.data ?? [];
    },
  });

  async function togglePremium(userId: string, current: boolean) {
    try {
      await client.models.UserProfile.update({ userId, isPremium: !current });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
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

// ===== Matches =====
function MatchesPanel() {
  const queryClient = useQueryClient();
  const { data: matches, isLoading } = useQuery({
    queryKey: ["admin-matches"],
    queryFn: async () => {
      const r: any = await client.models.Match.list({ limit: 1000 });
      return r?.data ?? [];
    },
  });

  async function deleteMatch(user1Id: string, user2Id: string) {
    if (!confirm("このマッチを削除しますか？")) return;
    try {
      await client.models.Match.delete({ user1Id, user2Id });
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
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
                  {m.createdAt ? new Date(m.createdAt).toLocaleDateString("ja-JP") : ""}
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

// ===== Swipes =====
function SwipesPanel() {
  const { data: swipes, isLoading } = useQuery({
    queryKey: ["admin-swipes"],
    queryFn: async () => {
      const r: any = await client.models.Swipe.list({ limit: 1000 });
      return (r?.data ?? []).sort((a: any, b: any) =>
        (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
      );
    },
  });

  // Build userId → displayName map
  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const r: any = await client.models.UserProfile.list({ limit: 1000 });
      return r?.data ?? [];
    },
  });

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
            <span className="text-gray-400">→</span>
            {s.direction === "OK" ? (
              <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-semibold text-pink-600">いいかも</span>
            ) : (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">また今度</span>
            )}
            <span className="text-gray-400">→</span>
            <span className="font-medium truncate max-w-[100px]">
              {nameMap[s.targetId] || s.targetId.slice(0, 8)}
            </span>
            <span className="ml-auto text-[10px] text-gray-300">
              {s.createdAt ? new Date(s.createdAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
    </div>
  );
}
