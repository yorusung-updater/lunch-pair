"use client";

import { useState } from "react";
import { client } from "@/lib/api-client";
import { compressAndUpload } from "@/utils/photo-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LunchSettingsForm from "@/components/LunchSettingsForm";
import PhotoUploadSection from "@/components/profile/PhotoUploadSection";
import BasicInfoSection from "@/components/profile/BasicInfoSection";
import PreferencesSection from "@/components/profile/PreferencesSection";

export default function ProfileSetup({
  userId,
  onComplete,
}: {
  userId: string;
  onComplete: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [department, setDepartment] = useState("");
  const [excludeSameDivision, setExcludeSameDivision] = useState(false);
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

  const photoSetters: [(f: File | null) => void, (url: string | null) => void][] = [
    [setPhoto1, setPhoto1Preview],
    [setPhoto2, setPhoto2Preview],
    [setPhoto3, setPhoto3Preview],
    [setPhoto4, setPhoto4Preview],
  ];

  function handlePhotoChange(index: number, file: File) {
    const [setFile, setPreview] = photoSetters[index];
    setFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
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
        excludeSameDivision,
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

        <PhotoUploadSection
          photos={[photo1, photo2, photo3, photo4]}
          photoPreviews={[photo1Preview, photo2Preview, photo3Preview, photo4Preview]}
          onPhotoChange={handlePhotoChange}
        />

        <BasicInfoSection
          displayName={displayName}
          department={department}
          excludeSameDivision={excludeSameDivision}
          onNameChange={setDisplayName}
          onDepartmentChange={setDepartment}
          onExcludeSameDivisionChange={setExcludeSameDivision}
        />

        <PreferencesSection
          selectedPrefs={selectedPrefs}
          onPrefsChange={setSelectedPrefs}
          freeText={preferenceFreeText}
          onFreeTextChange={setPreferenceFreeText}
        />

        {/* Lunch Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🍽️ ランチ設定</CardTitle>
          </CardHeader>
          <CardContent>
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
