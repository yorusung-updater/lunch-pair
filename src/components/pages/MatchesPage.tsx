"use client";

import { useState } from "react";
import { client } from "@/lib/api-client";
import { useMatches } from "@/hooks/use-matches";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ViewableProfile, MatchEntry } from "@/types";
import { formatDate } from "@/utils/date";
import ChatPage from "./ChatPage";

export default function MatchesPage({ userId }: { userId: string }) {
  const [selectedMatch, setSelectedMatch] = useState<ViewableProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [chatTarget, setChatTarget] = useState<MatchEntry | null>(null);
  const { data: matches, isLoading } = useMatches(userId);

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

  if (chatTarget) {
    return (
      <ChatPage
        userId={userId}
        matchedUserId={chatTarget.matchedUserId}
        matchedUserName={chatTarget.displayName}
        onBack={() => setChatTarget(null)}
      />
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
            <div
              key={match.matchedUserId}
              onClick={() => setChatTarget(match)}
              className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md active:scale-[0.98] transition-all"
            >
              <div
                className="relative shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  viewProfile(match.matchedUserId);
                }}
              >
                {match.photoUrl ? (
                  <img
                    src={match.photoUrl}
                    alt={match.displayName}
                    className="h-14 w-14 rounded-full object-cover border-2 border-orange-200"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-orange-600 border-2 border-orange-200">
                    {match.displayName.charAt(0)}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-400 border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[15px] truncate">{match.displayName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {match.matchedAt ? formatDate(match.matchedAt) + " マッチ" : ""}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 rounded-full bg-orange-50 px-3.5 py-2 text-orange-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="text-xs font-semibold">話す</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{selectedMatch?.displayName ?? "プロフィール"}</DialogTitle>
          </DialogHeader>
          {loadingProfile ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : selectedMatch ? (
            <div className="space-y-4">
              {selectedMatch.photo1Url && (
                <img src={selectedMatch.photo1Url} alt="顔写真" className="w-full rounded-lg object-cover aspect-square" />
              )}
              {selectedMatch.photo2Url && (
                <img src={selectedMatch.photo2Url} alt="写真" className="w-full rounded-lg object-cover aspect-[4/3]" />
              )}
              {selectedMatch.department && (
                <p className="text-sm text-muted-foreground">{selectedMatch.department}</p>
              )}
              {selectedMatch.preferences && selectedMatch.preferences.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedMatch.preferences.map((p: string) => (
                    <Badge key={p} variant="secondary">{p}</Badge>
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
