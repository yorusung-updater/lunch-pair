"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PhotoSlotConfig = {
  label: string;
  emoji: string;
  required: boolean;
};

const PHOTO_SLOTS: PhotoSlotConfig[] = [
  { label: "顔写真（必須）", emoji: "📸", required: true },
  { label: "その他（必須）", emoji: "🖼️", required: true },
  { label: "任意", emoji: "+", required: false },
  { label: "任意", emoji: "+", required: false },
];

const ALT_TEXTS = ["顔写真", "その他", "写真3", "写真4"];

export default function PhotoUploadSection({
  photos,
  photoPreviews,
  onPhotoChange,
}: {
  photos: (File | null)[];
  photoPreviews: (string | null)[];
  onPhotoChange: (index: number, file: File) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">写真（2枚必須・最大4枚）</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {PHOTO_SLOTS.map((slot, index) => {
            const preview = photoPreviews[index];
            const isRequired = slot.required;

            return (
              <label
                key={index}
                className={`relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
                  isRequired
                    ? "border-primary/50 bg-muted/50 hover:border-primary"
                    : "border-muted-foreground/30 bg-muted/30 hover:border-muted-foreground/50"
                }`}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt={ALT_TEXTS[index]}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2">
                    {isRequired ? (
                      <span className="text-2xl">{slot.emoji}</span>
                    ) : (
                      <span className="text-xl text-muted-foreground">
                        {slot.emoji}
                      </span>
                    )}
                    <p
                      className={`text-xs text-muted-foreground ${
                        isRequired ? "mt-1" : ""
                      }`}
                    >
                      {slot.label}
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onPhotoChange(index, file);
                  }}
                />
              </label>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          ※マッチング前は「その他」の写真のみ表示されます。顔写真はマッチング後に公開されます。
        </p>
      </CardContent>
    </Card>
  );
}
