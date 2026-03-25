"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { QUERY_KEYS } from "@/constants/query-keys";
import { toast } from "sonner";
import PhotoGrid from "./PhotoGrid";

interface ProfileViewProps {
  userId: string;
  profile: {
    displayName: string;
    department: string | null;
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
    ethicalTags?: string[] | null;
    ethicalScale?: string | null;
    ethicalMatchingStance?: string | null;
  };
  onEdit: () => void;
  onPhotoUpdate: (photoField: "photo1Key" | "photo2Key" | "photo3Key" | "photo4Key", file: File) => void;
  signOut: () => void;
}

export default function ProfileView({ userId, profile, onEdit, onPhotoUpdate, signOut }: ProfileViewProps) {
  const queryClient = useQueryClient();
  const [togglingSwipe, setTogglingSwipe] = useState(false);
  const [togglingLikes, setTogglingLikes] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryCategory, setInquiryCategory] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [sendingInquiry, setSendingInquiry] = useState(false);

  async function togglePlan(field: "hasUnlimitedSwipe" | "hasLikesReveal", current: boolean) {
    const setter = field === "hasUnlimitedSwipe" ? setTogglingSwipe : setTogglingLikes;
    setter(true);
    try {
      await client.models.UserProfile.update({ userId, [field]: !current });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myProfile(userId) });
      toast.success(!current ? "有効にしました" : "無効にしました");
    } catch {
      toast.error("変更に失敗しました");
    } finally {
      setter(false);
    }
  }

  async function submitInquiry() {
    if (!inquiryMessage.trim()) return;
    setSendingInquiry(true);
    try {
      await client.models.Inquiry.create({
        userId,
        displayName: profile.displayName,
        category: inquiryCategory || undefined,
        message: inquiryMessage.trim(),
        status: "OPEN",
      });
      toast.success("お問い合わせを送信しました");
      setShowInquiry(false);
      setInquiryCategory("");
      setInquiryMessage("");
    } catch {
      toast.error("送信に失敗しました");
    } finally {
      setSendingInquiry(false);
    }
  }

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

        {/* Ethical profile */}
        {(profile.ethicalScale || (profile.ethicalTags && profile.ethicalTags.length > 0) || profile.ethicalMatchingStance) && (
          <div className="rounded-2xl bg-white p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">🌱 エシカルプロフィール</h3>
            {profile.ethicalScale && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-16 shrink-0">実践度</span>
                <span className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-sm text-emerald-700">
                  {profile.ethicalScale}
                </span>
              </div>
            )}
            {profile.ethicalTags && profile.ethicalTags.length > 0 && (
              <div>
                <span className="text-xs text-gray-400">関心分野</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {profile.ethicalTags.map((tag: string) =>
                    tag && (
                      <span key={tag} className="rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-xs text-emerald-700">
                        {tag}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}
            {profile.ethicalMatchingStance && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-16 shrink-0">姿勢</span>
                <span className="text-sm text-gray-700">{profile.ethicalMatchingStance}</span>
              </div>
            )}
          </div>
        )}

        {/* Plan settings */}
        <div className="rounded-2xl bg-white p-4 shadow-sm space-y-1">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">プラン設定</h3>
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">スワイプし放題</p>
                <p className="text-[11px] text-gray-400">1日のスワイプ回数が無制限に</p>
              </div>
            </div>
            <button
              onClick={() => togglePlan("hasUnlimitedSwipe", profile.hasUnlimitedSwipe)}
              disabled={togglingSwipe}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                profile.hasUnlimitedSwipe ? "bg-blue-500" : "bg-gray-200"
              } ${togglingSwipe ? "opacity-50" : ""}`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  profile.hasUnlimitedSwipe ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <div className="border-t border-gray-50" />
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l3 3" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">いいね見放題</p>
                <p className="text-[11px] text-gray-400">自分にいいねした人が見れる</p>
              </div>
            </div>
            <button
              onClick={() => togglePlan("hasLikesReveal", profile.hasLikesReveal)}
              disabled={togglingLikes}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                profile.hasLikesReveal ? "bg-amber-500" : "bg-gray-200"
              } ${togglingLikes ? "opacity-50" : ""}`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  profile.hasLikesReveal ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center pt-1">
            ※テスト機能のため、実際の課金は発生しません
          </p>
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
            onClick={() => setShowInquiry(true)}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="flex-1 text-sm text-gray-700">運営へのお問い合わせ</span>
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

        {/* Inquiry modal */}
        {showInquiry && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40" onClick={() => setShowInquiry(false)}>
            <div
              className="w-full max-w-lg rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold">運営へのお問い合わせ</h3>
                <button onClick={() => setShowInquiry(false)} className="text-gray-400 hover:text-gray-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">カテゴリ</label>
                  <select
                    value={inquiryCategory}
                    onChange={(e) => setInquiryCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="">選択してください</option>
                    <option value="不具合報告">不具合報告</option>
                    <option value="機能要望">機能要望</option>
                    <option value="アカウント">アカウントについて</option>
                    <option value="通報">ユーザー通報</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">内容</label>
                  <textarea
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="お問い合わせ内容を入力してください..."
                    rows={4}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 resize-none"
                  />
                </div>
                <button
                  onClick={submitInquiry}
                  disabled={!inquiryMessage.trim() || sendingInquiry}
                  className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white active:scale-[0.98] transition-all disabled:bg-gray-200 disabled:text-gray-400"
                >
                  {sendingInquiry ? "送信中..." : "送信する"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
