"use client";

import PhotoGrid from "./PhotoGrid";

interface ProfileViewProps {
  profile: {
    displayName: string;
    department: string | null;
    preferenceFreeText: string | null;
    preferences: string[] | null;
    isPremium: boolean;
    photo1Url: string | null;
    photo2Url: string | null;
    photo3Url: string | null;
    photo4Url: string | null;
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

        {profile.isPremium && (
          <div className="absolute top-4 left-4 flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            プレミアム
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
                {profile.isPremium ? "プレミアム会員" : "無料会員"}
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
