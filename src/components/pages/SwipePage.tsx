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

export default function SwipePage({ userId }: { userId: string }) {
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [tutorialDone, setTutorialDone] = useState(false);
  const queryClient = useQueryClient();
  const { setMatchModal } = useUiStore();

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
        const result: any = await client.mutations.recordSwipe({
          targetId,
          direction,
        });
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

  return (
    <div className="relative h-full">
      <SwipeTutorial onDone={() => setTutorialDone(true)} />
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold">Lunch Pair</h1>
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
