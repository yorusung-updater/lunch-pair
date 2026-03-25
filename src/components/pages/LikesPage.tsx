"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { QUERY_KEYS } from "@/constants/query-keys";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUiStore } from "@/stores/ui-store";
import { toast } from "sonner";
import type { ViewableProfile } from "@/types";

type SubTab = "received" | "sent";

export default function LikesPage({ userId }: { userId: string }) {
  const [subTab, setSubTab] = useState<SubTab>("received");

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab navigation */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b px-4 pt-3">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setSubTab("received")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
              subTab === "received"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500"
            }`}
          >
            お相手から
          </button>
          <button
            onClick={() => setSubTab("sent")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
              subTab === "sent"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500"
            }`}
          >
            自分から
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {subTab === "received" ? (
          <ReceivedLikes userId={userId} />
        ) : (
          <SentLikes userId={userId} />
        )}
      </div>
    </div>
  );
}

/* ===== お相手から (Received Likes) ===== */
function ReceivedLikes({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { setMatchModal } = useUiStore();

  const { data: profile } = useQuery({
    queryKey: QUERY_KEYS.myProfile(userId),
    queryFn: async () => {
      const result: any = await client.models.UserProfile.get({ userId });
      return result?.data;
    },
  });

  const { data: likesData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.whoLikedMe(userId),
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
    enabled: !!profile?.hasLikesReveal,
  });

  async function handleQuickSwipe(targetId: string, direction: "OK" | "SKIP") {
    try {
      const result: any = await client.mutations.recordSwipe({ targetId, direction });
      if (result?.data?.isMatch) {
        setMatchModal(true, targetId);
        toast.success("マッチしました！");
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.whoLikedMe(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myLikes(userId) });
    } catch (err) {
      console.error("Swipe failed:", err);
    }
  }

  async function handleBecomePremium() {
    try {
      await client.models.UserProfile.update({ userId, hasLikesReveal: true });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myProfile(userId) });
      toast.success("いいね見放題パックを有効にしました！");
    } catch (err) {
      console.error("Premium upgrade failed:", err);
    }
  }

  if (!profile?.hasLikesReveal) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-8 pt-20 text-center">
        <div className="relative">
          <span className="text-6xl blur-sm">💛</span>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">🔒</span>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">あなたにいいねした人を見る</h2>
          <p className="text-sm text-muted-foreground">
            いいね見放題パックを有効にすると、あなたにOKした人が見れます
          </p>
        </div>
        <button
          onClick={handleBecomePremium}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-8 h-12 rounded-xl active:scale-95 transition-all"
        >
          いいね見放題パックを有効にする
        </button>
        <p className="text-[11px] text-gray-400">
          ※テスト機能のため、実際の課金は発生しません
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-bold">あなたにいいねした人</h2>
        {likesData && likesData.count > 0 && (
          <Badge className="bg-amber-500">{likesData.count}</Badge>
        )}
      </div>

      {!likesData || likesData.profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 pt-16 text-center">
          <span className="text-5xl">💛</span>
          <p className="text-muted-foreground">まだいいねされていません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {likesData.profiles.map((liker) => (
            <Card key={liker.userId}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    {liker.photo2Url ? (
                      <img src={liker.photo2Url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">🍽</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {liker.department && (
                      <p className="text-xs text-muted-foreground">{liker.department}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {liker.preferences?.slice(0, 3).map((p) => (
                        <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
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

/* ===== 自分から (Sent Likes) ===== */
function SentLikes({ userId }: { userId: string }) {
  const { data: likesData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.myLikes(userId),
    queryFn: async () => {
      const result: any = await client.queries.getMyLikes({ limit: 50 });
      if (result?.data?.profiles) {
        return {
          profiles: JSON.parse(result.data.profiles) as ViewableProfile[],
          count: result.data.count ?? 0,
        };
      }
      return { profiles: [], count: 0 };
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const matched = likesData?.profiles.filter((p) => p.isMatched) ?? [];
  const pending = likesData?.profiles.filter((p) => !p.isMatched) ?? [];

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-bold">自分がいいねした人</h2>
        {likesData && likesData.count > 0 && (
          <Badge variant="outline">{likesData.count}</Badge>
        )}
      </div>

      {!likesData || likesData.profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 pt-16 text-center">
          <span className="text-5xl">💗</span>
          <p className="text-muted-foreground">まだいいねしていません</p>
          <p className="text-xs text-muted-foreground">「さがす」タブでスワイプしてみましょう</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Matched section */}
          {matched.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-emerald-600 mb-2">
                マッチ済み ({matched.length})
              </p>
              <div className="space-y-2">
                {matched.map((p) => (
                  <SentLikeCard key={p.userId} profile={p} />
                ))}
              </div>
            </div>
          )}

          {/* Pending section */}
          {pending.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                返事待ち ({pending.length})
              </p>
              <div className="space-y-2">
                {pending.map((p) => (
                  <SentLikeCard key={p.userId} profile={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SentLikeCard({ profile }: { profile: ViewableProfile }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            {(profile.isMatched && profile.photo1Url) ? (
              <img src={profile.photo1Url} alt="" className="h-full w-full object-cover" />
            ) : profile.photo2Url ? (
              <img src={profile.photo2Url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl">🍽</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {profile.isMatched && profile.displayName ? (
                <p className="text-sm font-semibold truncate">{profile.displayName}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">名前非公開</p>
              )}
              {profile.isMatched && (
                <Badge className="bg-emerald-500 text-[10px] px-1.5 py-0">マッチ済み</Badge>
              )}
            </div>
            {profile.department && (
              <p className="text-xs text-muted-foreground">{profile.department}</p>
            )}
            <div className="flex flex-wrap gap-1 mt-1">
              {profile.preferences?.slice(0, 3).map((p) => (
                <Badge key={p} variant="outline" className="text-[10px] px-1.5 py-0">{p}</Badge>
              ))}
            </div>
          </div>
          {!profile.isMatched && (
            <span className="shrink-0 text-xs text-muted-foreground">返事待ち</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
