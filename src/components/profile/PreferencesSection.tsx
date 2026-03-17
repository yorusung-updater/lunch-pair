"use client";

import { PREFERENCE_OPTIONS } from "@/constants/preferences";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PreferencesSection({
  selectedPrefs,
  onPrefsChange,
  freeText,
  onFreeTextChange,
}: {
  selectedPrefs: string[];
  onPrefsChange: (prefs: string[]) => void;
  freeText: string;
  onFreeTextChange: (value: string) => void;
}) {
  function togglePref(pref: string) {
    onPrefsChange(
      selectedPrefs.includes(pref)
        ? selectedPrefs.filter((p) => p !== pref)
        : [...selectedPrefs, pref]
    );
  }

  return (
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
            value={freeText}
            onChange={(e) => onFreeTextChange(e.target.value)}
            placeholder="例: 新しいお店を開拓したい！"
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}
