"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { generateClient } from "aws-amplify/data";
import { uploadData, getUrl } from "aws-amplify/storage";
import { fetchAuthSession } from "aws-amplify/auth";
import imageCompression from "browser-image-compression";
import type { Schema } from "@/types/schema";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const client = generateClient<Schema>();

const PREFERENCE_OPTIONS = [
  "和食", "洋食", "中華", "韓国料理", "カレー",
  "ラーメン", "寿司", "カフェ", "居酒屋", "ヘルシー",
  "がっつり", "辛いもの好き", "甘党", "コーヒー好き",
];

export default function ProfilePage({
  userId,
  signOut,
}: {
  userId: string;
  signOut: () => void;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["myProfile", userId],
    queryFn: async () => {
      const result: any = await client.models.UserProfile.get({ userId });
      if (!result?.data) return null;
      const p = result.data;
      const getPhotoUrl = async (key: string | null | undefined) => {
        if (!key) return null;
        try {
          const r = await getUrl({ path: key, options: { expiresIn: 3600 } });
          return r.url.toString();
        } catch { return null; }
      };
      return {
        ...p,
        photo1Url: await getPhotoUrl(p.photo1Key),
        photo2Url: await getPhotoUrl(p.photo2Key),
        photo3Url: await getPhotoUrl(p.photo3Key),
        photo4Url: await getPhotoUrl(p.photo4Key),
      };
    },
  });

  // Edit state
  const [displayName, setDisplayName] = useState("");
  const [department, setDepartment] = useState("");
  const [preferenceFreeText, setPreferenceFreeText] = useState("");
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);

  function startEdit() {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setDepartment(profile.department ?? "");
    setPreferenceFreeText(profile.preferenceFreeText ?? "");
    setSelectedPrefs((profile.preferences ?? []).filter((p: string) => !!p));
    setEditing(true);
  }

  function togglePref(pref: string) {
    setSelectedPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await client.models.UserProfile.update({
        userId,
        displayName,
        department: department || undefined,
        preferenceFreeText: preferenceFreeText || undefined,
        preferences: selectedPrefs,
      });
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      setEditing(false);
      toast.success("プロフィールを更新しました");
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpdate(
    photoField: "photo1Key" | "photo2Key" | "photo3Key" | "photo4Key",
    file: File
  ) {
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true,
      });
      const session = await fetchAuthSession();
      const identityId = session.identityId!;
      const key = `photos/${identityId}/${photoField.replace("Key", "")}.jpg`;
      await uploadData({ path: key, data: compressed });
      await client.models.UserProfile.update({ userId, [photoField]: key });
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      toast.success("写真を更新しました");
    } catch {
      toast.error("写真の更新に失敗しました");
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
      </div>
    );
  }

  if (!profile) return null;

  // --- EDIT MODE ---
  if (editing) {
    return (
      <div className="min-h-full bg-gray-50 pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white/90 backdrop-blur-sm border-b px-4 py-3">
          <button onClick={() => setEditing(false)} className="text-sm text-gray-500">キャンセル</button>
          <span className="font-semibold text-sm">プロフィール編集</span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm font-semibold text-orange-500 disabled:text-gray-300"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">名前</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {/* Department */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">部署</label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="例: エンジニアリング"
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {/* Preferences */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">こだわり</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {PREFERENCE_OPTIONS.map((pref) => (
                <button
                  key={pref}
                  onClick={() => togglePref(pref)}
                  className={`rounded-full px-3.5 py-1.5 text-sm transition-all ${
                    selectedPrefs.includes(pref)
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-600"
                  }`}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>

          {/* Free text */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">自己紹介</label>
            <textarea
              value={preferenceFreeText}
              onChange={(e) => setPreferenceFreeText(e.target.value)}
              placeholder="ランチの好みや、一緒に食べたい人の雰囲気など..."
              rows={3}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 resize-none"
            />
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW MODE ---
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
          onClick={startEdit}
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
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-sm font-semibold text-gray-700">写真</h3>
            <span className="text-[11px] text-gray-400">タップして変更</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(["photo1Url", "photo2Url", "photo3Url", "photo4Url"] as const).map(
              (field, i) => {
                const url = profile[field];
                const keyField = field.replace("Url", "Key") as "photo1Key" | "photo2Key" | "photo3Key" | "photo4Key";
                const labels = ["メイン", "サブ", "", ""];
                return (
                  <label key={field} className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 cursor-pointer group">
                    {url ? (
                      <>
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none" className="opacity-0 group-hover:opacity-80 transition-opacity drop-shadow">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M15 12l-6 4V8l6 4z" fill="#666" />
                          </svg>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-0.5">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpdate(keyField, f); }} />
                    {labels[i] && (
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1">
                        <span className="text-[9px] text-white font-medium">{labels[i]}</span>
                      </div>
                    )}
                  </label>
                );
              }
            )}
          </div>
        </div>

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
            onClick={startEdit}
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
