"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { lazy, Suspense } from "react";
import React from "react";
import StatsPanel from "./panels/StatsPanel";
import UsersPanel from "./panels/UsersPanel";
import MatchesPanel from "./panels/MatchesPanel";
import SwipesPanel from "./panels/SwipesPanel";
import InquiriesPanel from "./panels/InquiriesPanel";
import ReportsPanel from "./panels/ReportsPanel";

const SimulationPanel = lazy(() => import("./panels/SimulationPanel"));
const AnalyticsPanel = lazy(() => import("./panels/AnalyticsPanel"));

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("AdminDashboard error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="rounded-xl bg-red-50 p-6">
            <h2 className="font-bold text-red-700 mb-2">エラーが発生しました</h2>
            <p className="text-sm text-red-600">{this.state.error?.message || "Unknown error"}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium"
            >
              ページを再読み込み
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const queryClient = new QueryClient();

type Tab = "users" | "matches" | "swipes" | "stats" | "simulation" | "analytics" | "inquiries" | "reports";

export default function AdminDashboard() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AdminContent />
        <Toaster position="top-center" />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

function AdminContent() {
  const [tab, setTab] = useState<Tab>("stats");

  const tabs: { id: Tab; label: string }[] = [
    { id: "stats", label: "概要" },
    { id: "users", label: "ユーザー" },
    { id: "matches", label: "マッチ" },
    { id: "swipes", label: "スワイプ" },
    { id: "reports", label: "通報" },
    { id: "inquiries", label: "問い合わせ" },
    { id: "simulation", label: "シミュレーション" },
    { id: "analytics", label: "分析" },
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
            <h1 className="font-bold text-gray-900">一緒にランチ行きましょう 管理画面</h1>
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
        <div className="max-w-4xl mx-auto px-4 flex gap-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
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
        {tab === "reports" && <ReportsPanel />}
        {tab === "inquiries" && <InquiriesPanel />}
        {tab === "simulation" && (
          <Suspense fallback={<div className="text-center py-8 text-gray-400">読み込み中...</div>}>
            <SimulationPanel />
          </Suspense>
        )}
        {tab === "analytics" && (
          <Suspense fallback={<div className="text-center py-8 text-gray-400">読み込み中...</div>}>
            <AnalyticsPanel />
          </Suspense>
        )}
      </div>
    </div>
  );
}
