"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/types/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ViewableProfile } from "./SwipePage";

const client = generateClient<Schema>();

export default function MatchesPage({ userId }: { userId: string }) {
  const [selectedMatch, setSelectedMatch] = useState<ViewableProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches", userId],
    queryFn: async () => {
      const [r1, r2] = await Promise.all([
        client.models.Match.listMatchByUser1Id({ user1Id: userId }),
        client.models.Match.listMatchByUser2Id({ user2Id: userId }),
      ]);
      const all = [
        ...r1.data.map((m) => ({
          matchedUserId: m.user2Id,
          displayName: m.user2DisplayName ?? "?",
          matchedAt: m.createdAt,
        })),
        ...r2.data.map((m) => ({
          matchedUserId: m.user1Id,
          displayName: m.user1DisplayName ?? "?",
          matchedAt: m.createdAt,
        })),
      ];
      // Sort by most recent
      return all.sort((a, b) =>
        (b.matchedAt ?? "").localeCompare(a.matchedAt ?? "")
      );
    },
  });

  async function viewProfile(matchedUserId: string) {
    setLoadingProfile(true);
    try {
      const result: any = await client.queries.getProfileForViewing({
        targetUserId: matchedUserId,
      });
      if (result?.data) {
        setSelectedMatch(result.data as ViewableProfile);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoadingProfile(false);
    }
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
      <h1 className="text-xl font-bold mb-4">マッチ</h1>

      {!matches || matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 pt-20 text-center">
          <span className="text-5xl">💬</span>
          <p className="text-muted-foreground">
            まだマッチがありません。スワイプしてみましょう！
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => (
            <Card
              key={match.matchedUserId}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => viewProfile(match.matchedUserId)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl">
                  💑
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{match.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {match.matchedAt
                      ? new Date(match.matchedAt).toLocaleDateString("ja-JP")
                      : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Profile Detail Dialog */}
      <Dialog
        open={!!selectedMatch}
        onOpenChange={() => setSelectedMatch(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {selectedMatch?.displayName ?? "プロフィール"}
            </DialogTitle>
          </DialogHeader>
          {loadingProfile ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : selectedMatch ? (
            <div className="space-y-4">
              {/* Face photo (revealed after match!) */}
              {selectedMatch.photo1Url && (
                <img
                  src={selectedMatch.photo1Url}
                  alt="顔写真"
                  className="w-full rounded-lg object-cover aspect-square"
                />
              )}
              {selectedMatch.photo2Url && (
                <img
                  src={selectedMatch.photo2Url}
                  alt="写真"
                  className="w-full rounded-lg object-cover aspect-[4/3]"
                />
              )}
              {selectedMatch.department && (
                <p className="text-sm text-muted-foreground">
                  {selectedMatch.department}
                </p>
              )}
              {selectedMatch.preferences &&
                selectedMatch.preferences.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMatch.preferences.map((p) => (
                      <Badge key={p} variant="secondary">
                        {p}
                      </Badge>
                    ))}
                  </div>
                )}
              {selectedMatch.preferenceFreeText && (
                <p className="text-sm">{selectedMatch.preferenceFreeText}</p>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
