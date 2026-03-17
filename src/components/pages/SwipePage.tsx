"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { QUERY_KEYS } from "@/constants/query-keys";
import type { ViewableProfile } from "@/types";
import SwipeDeck from "../SwipeDeck";
import SwipeTutorial from "../SwipeTutorial";
import { useUiStore } from "@/stores/ui-store";
import { toast } from "sonner";
import { PREFERENCE_OPTIONS } from "@/constants/preferences";
import { FREE_DAILY_SWIPE_LIMIT } from "@/constants/limits";
import LunchSettingsForm from "@/components/LunchSettingsForm";

export default function SwipePage({ userId }: { userId: string }) {
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [tutorialDone, setTutorialDone] = useState(false);
  const [dailyRemaining, setDailyRemaining] = useState<number | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filterDay, setFilterDay] = useState("");
  const [filterTime, setFilterTime] = useState("");
  const [filterBudget, setFilterBudget] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterPrefs, setFilterPrefs] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { setMatchModal } = useUiStore();
  const activeFilterCount = [filterDay, filterTime, filterBudget, filterArea].filter(Boolean).length + (filterPrefs.length > 0 ? 1 : 0);

  // Check user's package status
  const { data: myProfile } = useQuery({
    queryKey: QUERY_KEYS.myProfile(userId),
    queryFn: async () => {
      const r: any = await client.models.UserProfile.get({ userId });
      return r?.data;
    },
  });

  // Count today's swipes on mount
  useQuery({
    queryKey: ["dailySwipes", userId],
    queryFn: async () => {
      if (myProfile?.hasUnlimitedSwipe) {
        setDailyRemaining(null);
        return null;
      }
      const today = new Date().toISOString().slice(0, 10);
      const r: any = await client.models.Swipe.listSwipeBySwiperIdAndTargetId(
        { swiperId: userId },
        { limit: 1000 }
      );
      const todayCount = (r?.data ?? []).filter(
        (s: any) => s.createdAt?.startsWith(today)
      ).length;
      setDailyRemaining(Math.max(0, FREE_DAILY_SWIPE_LIMIT - todayCount));
      return todayCount;
    },
    enabled: myProfile !== undefined,
  });

  const { data: candidates, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.candidates(nextToken), filterDay, filterTime, filterBudget, filterArea, filterPrefs.join(",")],
    queryFn: async () => {
      const result: any = await client.queries.getSwipeCandidates({
        limit: 30,
        nextToken: nextToken ?? undefined,
        lunchDay: filterDay || undefined,
        lunchTime: filterTime || undefined,
        lunchBudget: filterBudget || undefined,
        lunchArea: filterArea || undefined,
      });
      if (result?.data?.profiles) {
        let profiles: ViewableProfile[] = JSON.parse(result.data.profiles);
        // Client-side filter by selected こだわり
        if (filterPrefs.length > 0) {
          profiles = profiles.filter((p) =>
            filterPrefs.some((fp) => p.preferences?.includes(fp))
          );
        }
        setNextToken(result.data.nextToken ?? null);
        return profiles;
      }
      return [];
    },
  });

  const handleSwipe = useCallback(
    async (targetId: string, direction: "OK" | "SKIP") => {
      try {
        const result: any = await client.mutations.recordSwipe({ targetId, direction });
        if (result?.data?.swipeRecorded === false && result?.data?.dailySwipesRemaining === 0) {
          setDailyRemaining(0);
          return;
        }
        if (result?.data?.dailySwipesRemaining !== undefined && result?.data?.dailySwipesRemaining !== null) {
          setDailyRemaining(result.data.dailySwipesRemaining);
        }
        if (result?.data?.isMatch) {
          setMatchModal(true, targetId);
          toast.success("マッチしました！🎉");
        }
      } catch (err) {
        console.error("Swipe failed:", err);
      }
    },
    [setMatchModal]
  );

  const handleActivateSwipePack = useCallback(async () => {
    try {
      await client.models.UserProfile.update({ userId, hasUnlimitedSwipe: true });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myProfile(userId) });
      setDailyRemaining(null);
      toast.success("スワイプし放題パックを有効にしました！");
    } catch {
      toast.error("有効化に失敗しました");
    }
  }, [userId, queryClient]);

  const handleEmpty = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["candidates"] });
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!candidates || candidates.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="text-5xl">🍽️</span>
        <h2 className="text-xl font-semibold">今はプロフィールがありません</h2>
        <p className="text-sm text-muted-foreground">
          新しいメンバーが登録するまでお待ちください
        </p>
      </div>
    );
  }

  // Swipe limit reached
  if (dailyRemaining === 0 && !myProfile?.hasUnlimitedSwipe) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold">本日のスワイプ上限に達しました</h2>
          <p className="text-sm text-muted-foreground mt-1">
            無料会員は1日{FREE_DAILY_SWIPE_LIMIT}回までスワイプできます
          </p>
        </div>
        <button
          onClick={handleActivateSwipePack}
          className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-8 py-3 text-sm font-semibold text-white shadow-md active:scale-95 transition-all"
        >
          スワイプし放題パックを有効にする
        </button>
        <p className="text-[11px] text-gray-400">
          ※テスト機能のため、実際の課金は発生しません
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <SwipeTutorial onDone={() => setTutorialDone(true)} />
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-bold">Lunch Pair</h1>
        <div className="flex items-center gap-2">
          {dailyRemaining !== null && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
              残り {dailyRemaining}回
            </span>
          )}
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              showFilter || activeFilterCount > 0 ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="12" y1="18" x2="20" y2="18" />
            </svg>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>
      {/* Filter panel */}
      {showFilter && (
        <div className="mx-4 mb-3 rounded-xl bg-white p-3 shadow-sm border border-gray-100 space-y-3">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 mb-1.5">こだわり</p>
            <div className="flex flex-wrap gap-1.5">
              {PREFERENCE_OPTIONS.map((p) => (
                <button key={p} onClick={() => setFilterPrefs((prev) =>
                  prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
                )}
                  className={`rounded-full px-2.5 py-1 text-xs transition-all ${
                    filterPrefs.includes(p) ? "bg-orange-500 text-white" : "bg-gray-50 text-gray-500"
                  }`}>{p}</button>
              ))}
            </div>
          </div>
          <LunchSettingsForm
            mode="filter"
            selectedDays={filterDay ? [filterDay] : []}
            onDaysChange={(days) => setFilterDay(days[0] ?? "")}
            selectedTime={filterTime}
            onTimeChange={setFilterTime}
            selectedBudget={filterBudget}
            onBudgetChange={setFilterBudget}
            selectedArea={filterArea}
            onAreaChange={setFilterArea}
          />
          {activeFilterCount > 0 && (
            <button
              onClick={() => { setFilterDay(""); setFilterTime(""); setFilterBudget(""); setFilterArea(""); setFilterPrefs([]); }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              フィルタをリセット
            </button>
          )}
        </div>
      )}
      {tutorialDone && (
        <SwipeDeck
          profiles={candidates}
          onSwipe={handleSwipe}
          onEmpty={handleEmpty}
        />
      )}
    </div>
  );
}
