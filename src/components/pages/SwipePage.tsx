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

const FREE_DAILY_LIMIT = 3;

export default function SwipePage({ userId }: { userId: string }) {
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [tutorialDone, setTutorialDone] = useState(false);
  const [dailyRemaining, setDailyRemaining] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { setMatchModal } = useUiStore();

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
      setDailyRemaining(Math.max(0, FREE_DAILY_LIMIT - todayCount));
      return todayCount;
    },
    enabled: myProfile !== undefined,
  });

  const { data: candidates, isLoading } = useQuery({
    queryKey: QUERY_KEYS.candidates(nextToken),
    queryFn: async () => {
      const result: any = await client.queries.getSwipeCandidates({
        limit: 10,
        nextToken: nextToken ?? undefined,
      });
      if (result?.data?.profiles) {
        const profiles: ViewableProfile[] = JSON.parse(result.data.profiles);
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
            無料会員は1日{FREE_DAILY_LIMIT}回までスワイプできます
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
        {dailyRemaining !== null && (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
            残り {dailyRemaining}回
          </span>
        )}
      </div>
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
