"use client";

import PhotoGrid from "./PhotoGrid";

interface ProfileViewProps {
  profile: {
    displayName: string;
    department: string | null;
    excludeSameDivision: boolean | null;
    preferenceFreeText: string | null;
    preferences: string[] | null;
    hasUnlimitedSwipe: boolean;
    hasLikesReveal: boolean;
    photo1Url: string | null;
    photo2Url: string | null;
    photo3Url: string | null;
    photo4Url: string | null;
    lunchDays?: string[] | null;
    lunchTime?: string | null;
    lunchBudget?: string | null;
    lunchArea?: string | null;
  };
  onEdit: () => void;
  onPhotoUpdate: (photoField: "photo1Key" | "photo2Key" | "photo3Key" | "photo4Key", file: File) => void;
  signOut: () => void;
}

export default function ProfileView({ profile, onEdit, onPhotoUpdate, signOut }: ProfileViewProps) {
  return (
    <div className="min-h-full bg-gray-50 pb-24">
      {/* Hero section with main photo */}
      <div className="relative">
        <div className="h-64 bg-gradient-to-br from-orange-400 to-pink-400">
          {profile.photo1Url && (
            <img src={profile.photo1Url} alt="" className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        {/* Profile info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h1 className="text-2xl font-bold drop-shadow-md">{profile.displayName}</h1>
          {profile.department && (
            <div className="flex items-center gap-1.5 mt-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20 7h-4V3H8v4H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
              </svg>
              <span className="text-sm opacity-90">{profile.department}</span>
              {profile.excludeSameDivision && (
                <span className="ml-1.5 rounded-full bg-white/20 px-2 py-0.5 text-[10px]">他本部のみ</span>
              )}
            </div>
          )}
        </div>

        {/* Edit button */}
        <button
          onClick={onEdit}
          className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
          編集
        </button>

        {(profile.hasUnlimitedSwipe || profile.hasLikesReveal) && (
          <div className="absolute top-4 left-4 flex flex-col gap-1">
            {profile.hasUnlimitedSwipe && (
              <div className="flex items-center gap-1 rounded-full bg-blue-500 px-3 py-1.5 text-[10px] font-semibold text-white shadow-sm">
                スワイプし放題
              </div>
            )}
            {profile.hasLikesReveal && (
              <div className="flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-[10px] font-semibold text-white shadow-sm">
                いいね見放題
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 space-y-4 -mt-2">
        {/* Photos grid */}
        <PhotoGrid profile={profile} onPhotoUpdate={onPhotoUpdate} />

        {/* About section */}
        <div className="rounded-2xl bg-white p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">自己紹介</h3>
          {profile.preferenceFreeText ? (
            <p className="text-sm text-gray-600 leading-relaxed">{profile.preferenceFreeText}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">まだ自己紹介がありません</p>
          )}
        </div>

        {/* Preferences */}
        {profile.preferences && profile.preferences.length > 0 && (
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-2.5">こだわり</h3>
            <div className="flex flex-wrap gap-2">
              {profile.preferences.map((p: string) =>
                p && (
                  <span key={p} className="rounded-full bg-orange-50 border border-orange-100 px-3 py-1 text-sm text-orange-700">
                    {p}
                  </span>
                )
              )}
            </div>
          </div>
        )}

        {/* Lunch settings */}
        {(profile.lunchDays?.length || profile.lunchTime || profile.lunchBudget || profile.lunchArea) && (
          <div className="rounded-2xl bg-white p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">ランチ設定</h3>
            {profile.lunchDays && profile.lunchDays.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-12 shrink-0">曜日</span>
                <div className="flex gap-1.5">
                  {profile.lunchDays.map((d: string) => (
                    <span key={d} className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-xs font-medium text-orange-700">{d}</span>
                  ))}
                </div>
              </div>
            )}
            {profile.lunchTime && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-12 shrink-0">時間</span>
                <span className="text-sm text-gray-700">{profile.lunchTime}</span>
              </div>
            )}
            {profile.lunchBudget && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-12 shrink-0">予算</span>
                <span className="text-sm text-gray-700">{profile.lunchBudget}</span>
              </div>
            )}
            {profile.lunchArea && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-12 shrink-0">エリア</span>
                <span className="text-sm text-gray-700">{profile.lunchArea}</span>
              </div>
            )}
          </div>
        )}

        {/* Stats / Info */}
        <div className="rounded-2xl bg-white shadow-sm divide-y divide-gray-50">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round">
              <path d="M20 7h-4V3H8v4H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
            </svg>
            <div className="flex-1">
              <p className="text-xs text-gray-400">部署</p>
              <p className="text-sm font-medium text-gray-700">{profile.department || "未設定"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <div className="flex-1">
              <p className="text-xs text-gray-400">ステータス</p>
              <p className="text-sm font-medium text-gray-700">
                {profile.hasUnlimitedSwipe && profile.hasLikesReveal
                  ? "スワイプし放題 + いいね見放題"
                  : profile.hasUnlimitedSwipe
                  ? "スワイプし放題パック"
                  : profile.hasLikesReveal
                  ? "いいね見放題パック"
                  : "無料会員"}
              </p>
            </div>
          </div>
        </div>

        {/* Settings / Logout */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <button
            onClick={onEdit}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            <span className="flex-1 text-sm text-gray-700">プロフィールを編集</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <div className="border-t border-gray-50" />
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="flex-1 text-sm text-red-500">ログアウト</span>
          </button>
        </div>
      </div>
    </div>
  );
}
