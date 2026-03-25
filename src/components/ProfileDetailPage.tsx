"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { ViewableProfile } from "@/types";
import ReportSheet from "@/components/ReportSheet";

export default function ProfileDetailPage({
  profile,
  onBack,
  onChat,
  currentUserId,
  currentUserName,
}: {
  profile: ViewableProfile;
  onBack: () => void;
  onChat?: () => void;
  currentUserId?: string;
  currentUserName?: string;
}) {
  const [showReport, setShowReport] = useState(false);
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border-b px-4 py-3 shadow-sm shrink-0">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <p className="font-semibold text-sm">{profile.displayName ?? "プロフィール"}</p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero photo */}
        {profile.photo1Url && (
          <div className="relative">
            <img
              src={profile.photo1Url}
              alt=""
              className="w-full aspect-square object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-4">
              <h2 className="text-2xl font-bold text-white">{profile.displayName}</h2>
              {profile.department && (
                <p className="text-sm text-white/80 mt-0.5">{profile.department}</p>
              )}
            </div>
          </div>
        )}

        {!profile.photo1Url && (
          <div className="px-5 pt-5 pb-2">
            <h2 className="text-2xl font-bold">{profile.displayName}</h2>
            {profile.department && (
              <p className="text-sm text-muted-foreground mt-1">{profile.department}</p>
            )}
          </div>
        )}

        <div className="px-5 pb-8">
          {/* Sub photos */}
          {profile.photo2Url && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <img src={profile.photo2Url} alt="" className="w-full rounded-xl object-cover aspect-square" />
              {profile.photo3Url && (
                <img src={profile.photo3Url} alt="" className="w-full rounded-xl object-cover aspect-square" />
              )}
              {profile.photo4Url && !profile.photo3Url && (
                <img src={profile.photo4Url} alt="" className="w-full rounded-xl object-cover aspect-square" />
              )}
            </div>
          )}
          {profile.photo3Url && profile.photo4Url && (
            <div className="mt-2">
              <img src={profile.photo4Url} alt="" className="w-full rounded-xl object-cover aspect-[2/1]" />
            </div>
          )}

          {/* Preferences */}
          {profile.preferences && profile.preferences.length > 0 && (
            <div className="mt-5">
              <h3 className="text-xs font-semibold text-muted-foreground mb-2">こだわり</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.preferences.map((p: string) => (
                  <Badge key={p} variant="outline" className="border-orange-300 text-orange-600 bg-orange-50">{p}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Free text */}
          {profile.preferenceFreeText && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-muted-foreground mb-1">自己紹介</h3>
              <p className="text-sm leading-relaxed">{profile.preferenceFreeText}</p>
            </div>
          )}

          {/* Lunch settings */}
          {(profile.lunchDays || profile.lunchTime || profile.lunchBudget || profile.lunchArea) && (
            <div className="mt-5 rounded-xl bg-gray-50 p-4 space-y-2.5">
              <h3 className="text-xs font-semibold text-muted-foreground">ランチ情報</h3>
              {profile.lunchDays && profile.lunchDays.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-16 shrink-0">曜日</span>
                  <div className="flex gap-1">
                    {profile.lunchDays.map((d: string) => (
                      <span key={d} className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-xs font-medium text-orange-700">{d}</span>
                    ))}
                  </div>
                </div>
              )}
              {profile.lunchTime && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-16 shrink-0">時間</span>
                  <span>{profile.lunchTime}</span>
                </div>
              )}
              {profile.lunchBudget && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-16 shrink-0">予算</span>
                  <span>{profile.lunchBudget}</span>
                </div>
              )}
              {profile.lunchArea && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-16 shrink-0">エリア</span>
                  <span>{profile.lunchArea}</span>
                </div>
              )}
            </div>
          )}

          {/* Ethical profile (only shown when matched) */}
          {(profile.ethicalScale || (profile.ethicalTags && profile.ethicalTags.length > 0) || profile.ethicalMatchingStance) && (
            <div className="mt-5 rounded-xl bg-emerald-50/50 p-4 space-y-2.5">
              <h3 className="text-xs font-semibold text-muted-foreground">🌱 エシカルプロフィール</h3>
              {profile.ethicalScale && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-16 shrink-0">実践度</span>
                  <Badge variant="outline" className="border-emerald-300 text-emerald-600 bg-emerald-50">
                    {profile.ethicalScale}
                  </Badge>
                </div>
              )}
              {profile.ethicalTags && profile.ethicalTags.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">関心分野</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {profile.ethicalTags.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="border-emerald-300 text-emerald-600 bg-emerald-50 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {profile.ethicalMatchingStance && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-16 shrink-0">姿勢</span>
                  <span>{profile.ethicalMatchingStance}</span>
                </div>
              )}
            </div>
          )}

          {/* Chat button */}
          {onChat && (
            <button
              onClick={onChat}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 py-3.5 text-white font-semibold text-sm shadow-lg shadow-orange-200 active:scale-[0.97] transition-transform"
            >
              💬 メッセージを送る
            </button>
          )}

          {/* Report button */}
          {currentUserId && (
            <button
              onClick={() => setShowReport(true)}
              className="mt-3 w-full py-2.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              このユーザーを通報する
            </button>
          )}
        </div>
      </div>

      {showReport && currentUserId && (
        <ReportSheet
          reporterId={currentUserId}
          reporterName={currentUserName ?? ""}
          targetId={profile.userId}
          targetName={profile.displayName ?? "不明"}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
