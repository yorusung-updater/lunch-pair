"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { PREFERENCE_OPTIONS } from "@/constants/preferences";
import { LUNCH_DAYS, LUNCH_TIMES, LUNCH_BUDGETS, LUNCH_AREAS } from "@/constants/lunch";
import { QUERY_KEYS } from "@/constants/query-keys";
import { toast } from "sonner";

interface ProfileEditProps {
  userId: string;
  profile: {
    displayName: string;
    department: string | null;
    preferenceFreeText: string | null;
    preferences: string[] | null;
    lunchDays: string[] | null;
    lunchTime: string | null;
    lunchBudget: string | null;
    lunchArea: string | null;
  };
  onCancel: () => void;
  onSaved: () => void;
}

export default function ProfileEdit({ userId, profile, onCancel, onSaved }: ProfileEditProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [department, setDepartment] = useState(profile.department ?? "");
  const [preferenceFreeText, setPreferenceFreeText] = useState(profile.preferenceFreeText ?? "");
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(
    (profile.preferences ?? []).filter((p: string) => !!p)
  );
  const [selectedLunchDays, setSelectedLunchDays] = useState<string[]>(
    (profile.lunchDays ?? []).filter(Boolean)
  );
  const [lunchTime, setLunchTime] = useState(profile.lunchTime ?? "");
  const [lunchBudget, setLunchBudget] = useState(profile.lunchBudget ?? "");
  const [lunchArea, setLunchArea] = useState(profile.lunchArea ?? "");

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
        lunchDays: selectedLunchDays.length > 0 ? selectedLunchDays : undefined,
        lunchTime: lunchTime || undefined,
        lunchBudget: lunchBudget || undefined,
        lunchArea: lunchArea || undefined,
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myProfile(userId) });
      onSaved();
      toast.success("プロフィールを更新しました");
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-full bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-white/90 backdrop-blur-sm border-b px-4 py-3">
        <button onClick={onCancel} className="text-sm text-gray-500">キャンセル</button>
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

        {/* Lunch settings */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">🍽️ ランチ設定</label>
          <div className="mt-2 space-y-3 rounded-xl bg-white border border-gray-200 p-3">
            <div>
              <p className="text-[11px] text-gray-400 mb-1">曜日</p>
              <div className="flex gap-1.5">
                {LUNCH_DAYS.map((d) => (
                  <button key={d} type="button"
                    onClick={() => setSelectedLunchDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d])}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium transition-all ${
                      selectedLunchDays.includes(d) ? "bg-orange-500 text-white" : "bg-gray-50 text-gray-500"
                    }`}>{d}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-1">時間</p>
              <div className="flex flex-wrap gap-1.5">
                {LUNCH_TIMES.map((t) => (
                  <button key={t} type="button" onClick={() => setLunchTime(lunchTime === t ? "" : t)}
                    className={`rounded-full px-2.5 py-1 text-xs transition-all ${
                      lunchTime === t ? "bg-orange-500 text-white" : "bg-gray-50 text-gray-500"
                    }`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-1">予算</p>
              <div className="flex flex-wrap gap-1.5">
                {LUNCH_BUDGETS.map((b) => (
                  <button key={b} type="button" onClick={() => setLunchBudget(lunchBudget === b ? "" : b)}
                    className={`rounded-full px-2.5 py-1 text-xs transition-all ${
                      lunchBudget === b ? "bg-orange-500 text-white" : "bg-gray-50 text-gray-500"
                    }`}>{b}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-1">エリア</p>
              <div className="flex flex-wrap gap-1.5">
                {LUNCH_AREAS.map((a) => (
                  <button key={a} type="button" onClick={() => setLunchArea(lunchArea === a ? "" : a)}
                    className={`rounded-full px-2.5 py-1 text-xs transition-all ${
                      lunchArea === a ? "bg-orange-500 text-white" : "bg-gray-50 text-gray-500"
                    }`}>{a}</button>
                ))}
              </div>
            </div>
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
