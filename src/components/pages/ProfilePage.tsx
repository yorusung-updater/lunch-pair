"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { generateClient } from "aws-amplify/data";
import { uploadData, getUrl } from "aws-amplify/storage";
import imageCompression from "browser-image-compression";
import type { Schema } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
      // Generate presigned URLs for display
      const getPhotoUrl = async (key: string | null | undefined) => {
        if (!key) return null;
        try {
          const result = await getUrl({ path: key, options: { expiresIn: 3600 } });
          return result.url.toString();
        } catch {
          return null;
        }
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
    } catch (err) {
      console.error("Update failed:", err);
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
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      });
      const key = `photos/${userId}/${photoField.replace("Key", "")}.jpg`;
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">プロフィール</h1>

      {/* Photos */}
      <div className="grid grid-cols-2 gap-2">
        {(["photo1Url", "photo2Url", "photo3Url", "photo4Url"] as const).map(
          (field, i) => {
            const url = profile[field];
            const keyField = field.replace("Url", "Key") as
              | "photo1Key"
              | "photo2Key"
              | "photo3Key"
              | "photo4Key";

            return (
              <label
                key={field}
                className="relative aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer"
              >
                {url ? (
                  <img
                    src={url}
                    alt={`写真${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    +
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpdate(keyField, file);
                  }}
                />
                <div className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">
                  {i === 0 ? "顔" : i === 1 ? "その他" : `写真${i + 1}`}
                </div>
              </label>
            );
          }
        )}
      </div>

      {/* Profile Info */}
      {editing ? (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <Label>名前</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>部署</Label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>こだわり</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PREFERENCE_OPTIONS.map((pref) => (
                  <Badge
                    key={pref}
                    variant={
                      selectedPrefs.includes(pref) ? "default" : "outline"
                    }
                    className="cursor-pointer text-sm py-1 px-2"
                    onClick={() => togglePref(pref)}
                  >
                    {pref}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>自由記入</Label>
              <Input
                value={preferenceFreeText}
                onChange={(e) => setPreferenceFreeText(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "保存中..." : "保存"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditing(false)}
                className="flex-1"
              >
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{profile.displayName}</h2>
              <Button variant="outline" size="sm" onClick={startEdit}>
                編集
              </Button>
            </div>
            {profile.department && (
              <p className="text-sm text-muted-foreground">
                {profile.department}
              </p>
            )}
            {profile.preferences && profile.preferences.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {profile.preferences.map(
                  (p: string) =>
                    p && (
                      <Badge key={p} variant="secondary">
                        {p}
                      </Badge>
                    )
                )}
              </div>
            )}
            {profile.preferenceFreeText && (
              <p className="text-sm">{profile.preferenceFreeText}</p>
            )}
            {profile.isPremium && (
              <Badge className="bg-amber-500">プレミアム会員</Badge>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      <Button
        variant="outline"
        className="w-full text-destructive"
        onClick={signOut}
      >
        ログアウト
      </Button>
    </div>
  );
}
