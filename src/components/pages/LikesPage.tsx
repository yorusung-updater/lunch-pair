"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/types/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui-store";
import { toast } from "sonner";
import type { ViewableProfile } from "./SwipePage";

const client = generateClient<Schema>();

export default function LikesPage({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { setMatchModal } = useUiStore();

  // Check premium status
  const { data: profile } = useQuery({
    queryKey: ["myProfile", userId],
    queryFn: async () => {
      const result: any = await client.models.UserProfile.get({ userId });
      return result?.data;
    },
  });

  const { data: likesData, isLoading } = useQuery({
    queryKey: ["whoLikedMe", userId],
    queryFn: async () => {
      const result: any = await client.queries.getWhoLikedMe({ limit: 20 });
      if (result?.data?.profiles) {
        return {
          profiles: JSON.parse(result.data.profiles) as ViewableProfile[],
          count: result.data.count ?? 0,
        };
      }
      return { profiles: [], count: 0 };
    },
    enabled: !!profile?.isPremium,
  });

  async function handleQuickSwipe(targetId: string, direction: "OK" | "SKIP") {
    try {
      const result: any = await client.mutations.recordSwipe({
        targetId,
        direction,
      });
      if (result?.data?.isMatch) {
        setMatchModal(true, targetId);
        toast.success("マッチしました！🎉");
      }
      queryClient.invalidateQueries({ queryKey: ["whoLikedMe"] });
    } catch (err) {
      console.error("Swipe failed:", err);
    }
  }

  async function handleBecomePremium() {
    try {
      await client.models.UserProfile.update({
        userId,
        isPremium: true,
      });
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      toast.success("プレミアム会員になりました！");
    } catch (err) {
      console.error("Premium upgrade failed:", err);
    }
  }

  if (!profile?.isPremium) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-8 pt-20 text-center">
        <div className="relative">
          <span className="text-6xl blur-sm">💛</span>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">🔒</span>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">
            あなたにいいねした人を見る
          </h2>
          <p className="text-sm text-muted-foreground">
            プレミアム会員になると、あなたにOKした人が見れます
          </p>
        </div>
        <Button
          onClick={handleBecomePremium}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-8 h-12"
        >
          課金したよ！（テスト用）
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-xl font-bold">いいね</h1>
        {likesData && likesData.count > 0 && (
          <Badge className="bg-amber-500">{likesData.count}</Badge>
        )}
      </div>

      {!likesData || likesData.profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 pt-20 text-center">
          <span className="text-5xl">💛</span>
          <p className="text-muted-foreground">
            まだいいねされていません
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {likesData.profiles.map((liker) => (
            <Card key={liker.userId}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Photo (blurred/small) */}
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    {liker.photo2Url ? (
                      <img
                        src={liker.photo2Url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">
                        🍽️
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {liker.department && (
                      <p className="text-xs text-muted-foreground">
                        {liker.department}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {liker.preferences?.slice(0, 3).map((p) => (
                        <Badge key={p} variant="outline" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      className="flex items-center gap-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm active:scale-95 transition-all"
                      onClick={() => handleQuickSwipe(liker.userId, "OK")}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      いいかも
                    </button>
                    <button
                      className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-400 active:scale-95 transition-all"
                      onClick={() => handleQuickSwipe(liker.userId, "SKIP")}
                    >
                      スキップ
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
