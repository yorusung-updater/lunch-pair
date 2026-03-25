"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { PREFERENCE_OPTIONS } from "@/constants/preferences";
import { QUERY_KEYS } from "@/constants/query-keys";
import { toast } from "sonner";
import { DIVISIONS } from "@/constants/divisions";
import LunchSettingsForm from "@/components/LunchSettingsForm";
import EthicalSection from "@/components/profile/EthicalSection";

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
    ethicalTags: string[] | null;
    ethicalScale: string | null;
    ethicalMatchingStance: string | null;
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
  const [ethicalTags, setEthicalTags] = useState<string[]>(
    (profile.ethicalTags ?? []).filter(Boolean)
  );
  const [ethicalScale, setEthicalScale] = useState(profile.ethicalScale ?? "");
  const [ethicalMatchingStance, setEthicalMatchingStance] = useState(profile.ethicalMatchingStance ?? "");

  // テストアカウントの場合は自動でテストデータをロード
  useEffect(() => {
    const loadTestData = async () => {
      // ユーザーIDがtest1~test10の場合
      if (userId && userId.match(/^test\d+$/)) {
        try {
          const response = await fetch("/test-profiles.json");
          const testProfiles = await response.json();
          const testData = testProfiles.find(
            (p: any) => p.email.replace("@example.com", "") === userId
          );

          if (testData) {
            setDisplayName(testData.displayName);
            setDepartment(testData.department);
            setPreferenceFreeText("ランチを一緒に食べられる同僚を探しています。");
            setSelectedPrefs(testData.preferences || []);
            setLunchTime(testData.lunchTime);
            setLunchBudget(testData.lunchBudget);
            setLunchArea(testData.lunchArea);
            setEthicalScale(testData.ethicalScale);
            setEthicalTags(testData.ethicalTags || []);
            setEthicalMatchingStance("価値観の違いを尊重したい");
            setSelectedLunchDays(["月", "水", "金"]);
          }
        } catch (error) {
          console.log("Test data load skipped");
        }
      }
    };

    loadTestData();
  }, [userId]);

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
        ethicalTags: ethicalTags.length > 0 ? ethicalTags : undefined,
        ethicalScale: ethicalScale || undefined,
        ethicalMatchingStance: ethicalMatchingStance || undefined,
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
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">所属本部</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          >
            <option value="">選択してください</option>
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
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
          <div className="mt-2 rounded-xl bg-white border border-gray-200 p-3">
            <LunchSettingsForm
              selectedDays={selectedLunchDays}
              onDaysChange={setSelectedLunchDays}
              selectedTime={lunchTime}
              onTimeChange={setLunchTime}
              selectedBudget={lunchBudget}
              onBudgetChange={setLunchBudget}
              selectedArea={lunchArea}
              onAreaChange={setLunchArea}
            />
          </div>
        </div>

        {/* Ethical Profile */}
        <EthicalSection
          selectedTags={ethicalTags}
          onTagsChange={setEthicalTags}
          scale={ethicalScale}
          onScaleChange={setEthicalScale}
          matchingStance={ethicalMatchingStance}
          onMatchingStanceChange={setEthicalMatchingStance}
        />

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
