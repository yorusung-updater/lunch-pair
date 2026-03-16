"use client";

import { useState } from "react";
import { client } from "@/lib/api-client";
import { compressAndUpload } from "@/utils/photo-upload";
import { PREFERENCE_OPTIONS } from "@/constants/preferences";
import { LUNCH_DAYS, LUNCH_TIMES, LUNCH_BUDGETS, LUNCH_AREAS } from "@/constants/lunch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProfileSetup({
  userId,
  onComplete,
}: {
  userId: string;
  onComplete: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [department, setDepartment] = useState("");
  const [preferenceFreeText, setPreferenceFreeText] = useState("");
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  const [photo1, setPhoto1] = useState<File | null>(null);
  const [photo2, setPhoto2] = useState<File | null>(null);
  const [photo3, setPhoto3] = useState<File | null>(null);
  const [photo4, setPhoto4] = useState<File | null>(null);
  const [photo1Preview, setPhoto1Preview] = useState<string | null>(null);
  const [photo2Preview, setPhoto2Preview] = useState<string | null>(null);
  const [photo3Preview, setPhoto3Preview] = useState<string | null>(null);
  const [photo4Preview, setPhoto4Preview] = useState<string | null>(null);
  const [selectedLunchDays, setSelectedLunchDays] = useState<string[]>([]);
  const [lunchTime, setLunchTime] = useState("");
  const [lunchBudget, setLunchBudget] = useState("");
  const [lunchArea, setLunchArea] = useState("");
  const [loading, setLoading] = useState(false);

  function handleFileChange(
    file: File | undefined,
    setFile: (f: File | null) => void,
    setPreview: (url: string | null) => void
  ) {
    if (!file) return;
    setFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function togglePref(pref: string) {
    setSelectedPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  }

  async function handleSubmit() {
    if (!displayName || !photo1 || !photo2) return;
    setLoading(true);

    try {
      const [photo1Key, photo2Key] = await Promise.all([
        compressAndUpload(photo1, "photo1.jpg"),
        compressAndUpload(photo2, "photo2.jpg"),
      ]);

      let photo3Key: string | undefined;
      let photo4Key: string | undefined;

      if (photo3) {
        photo3Key = await compressAndUpload(photo3, "photo3.jpg");
      }
      if (photo4) {
        photo4Key = await compressAndUpload(photo4, "photo4.jpg");
      }

      await client.models.UserProfile.create({
        userId,
        displayName,
        photo1Key,
        photo2Key,
        photo3Key,
        photo4Key,
        preferences: selectedPrefs,
        preferenceFreeText: preferenceFreeText || undefined,
        department: department || undefined,
        lunchDays: selectedLunchDays.length > 0 ? selectedLunchDays : undefined,
        lunchTime: lunchTime || undefined,
        lunchBudget: lunchBudget || undefined,
        lunchArea: lunchArea || undefined,
        hasUnlimitedSwipe: false,
        hasLikesReveal: false,
      });

      onComplete();
    } catch (err) {
      console.error("Profile creation failed:", err);
      alert("プロフィールの作成に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = displayName && photo1 && photo2 && !loading;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="text-center pt-8 pb-4">
          <h1 className="text-2xl font-bold">プロフィール登録</h1>
          <p className="text-sm text-muted-foreground mt-1">
            まずはあなたのことを教えてください
          </p>
        </div>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">写真（2枚必須・最大4枚）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {/* Photo 1 - Face (required) */}
              <label className="relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-primary/50 bg-muted/50 hover:border-primary transition-colors">
                {photo1Preview ? (
                  <img src={photo1Preview} alt="顔写真" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center p-2">
                    <span className="text-2xl">📸</span>
                    <p className="text-xs text-muted-foreground mt-1">顔写真（必須）</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0], setPhoto1, setPhoto1Preview)}
                />
              </label>

              {/* Photo 2 - Other (required) */}
              <label className="relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-primary/50 bg-muted/50 hover:border-primary transition-colors">
                {photo2Preview ? (
                  <img src={photo2Preview} alt="その他" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center p-2">
                    <span className="text-2xl">🖼️</span>
                    <p className="text-xs text-muted-foreground mt-1">その他（必須）</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0], setPhoto2, setPhoto2Preview)}
                />
              </label>

              {/* Photo 3 - Optional */}
              <label className="relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 hover:border-muted-foreground/50 transition-colors">
                {photo3Preview ? (
                  <img src={photo3Preview} alt="写真3" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center p-2">
                    <span className="text-xl text-muted-foreground">+</span>
                    <p className="text-xs text-muted-foreground">任意</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0], setPhoto3, setPhoto3Preview)}
                />
              </label>

              {/* Photo 4 - Optional */}
              <label className="relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 hover:border-muted-foreground/50 transition-colors">
                {photo4Preview ? (
                  <img src={photo4Preview} alt="写真4" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center p-2">
                    <span className="text-xl text-muted-foreground">+</span>
                    <p className="text-xs text-muted-foreground">任意</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0], setPhoto4, setPhoto4Preview)}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ※マッチング前は「その他」の写真のみ表示されます。顔写真はマッチング後に公開されます。
            </p>
          </CardContent>
        </Card>

        {/* Name & Department */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="表示名を入力"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dept">部署（任意）</Label>
              <Input
                id="dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="例: エンジニアリング"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">こだわり</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {PREFERENCE_OPTIONS.map((pref) => (
                <Badge
                  key={pref}
                  variant={selectedPrefs.includes(pref) ? "default" : "outline"}
                  className="cursor-pointer select-none text-sm py-1.5 px-3"
                  onClick={() => togglePref(pref)}
                >
                  {pref}
                </Badge>
              ))}
            </div>
            <div>
              <Label htmlFor="freetext">自由記入（任意）</Label>
              <Input
                id="freetext"
                value={preferenceFreeText}
                onChange={(e) => setPreferenceFreeText(e.target.value)}
                placeholder="例: 新しいお店を開拓したい！"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lunch Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🍽️ ランチ設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>ランチ可能な曜日</Label>
              <div className="flex gap-2 mt-2">
                {LUNCH_DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedLunchDays((prev) =>
                      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                    )}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all ${
                      selectedLunchDays.includes(day)
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>希望時間</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {LUNCH_TIMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setLunchTime(lunchTime === t ? "" : t)}
                    className={`rounded-full px-3 py-1.5 text-sm transition-all ${
                      lunchTime === t
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>予算</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {LUNCH_BUDGETS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setLunchBudget(lunchBudget === b ? "" : b)}
                    className={`rounded-full px-3 py-1.5 text-sm transition-all ${
                      lunchBudget === b
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>エリア</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {LUNCH_AREAS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setLunchArea(lunchArea === a ? "" : a)}
                    className={`rounded-full px-3 py-1.5 text-sm transition-all ${
                      lunchArea === a
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full h-12 text-base font-semibold"
        >
          {loading ? "登録中..." : "プロフィールを登録する"}
        </Button>
      </div>
    </div>
  );
}
