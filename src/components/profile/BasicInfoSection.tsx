"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIVISIONS } from "@/constants/divisions";

export default function BasicInfoSection({
  displayName,
  department,
  excludeSameDivision,
  onNameChange,
  onDepartmentChange,
  onExcludeSameDivisionChange,
}: {
  displayName: string;
  department: string;
  excludeSameDivision: boolean;
  onNameChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onExcludeSameDivisionChange: (value: boolean) => void;
}) {
  return (
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
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="表示名を入力"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="dept">所属本部</Label>
          <select
            id="dept"
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          >
            <option value="">選択してください</option>
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        {department && (
          <label className="flex items-center gap-3 cursor-pointer rounded-lg bg-gray-50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={excludeSameDivision}
              onChange={(e) => onExcludeSameDivisionChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
            />
            <div>
              <p className="text-sm font-medium text-gray-700">同じ本部のメンバーを除外する</p>
              <p className="text-xs text-gray-400">異なる本部の人とだけマッチングします</p>
            </div>
          </label>
        )}
      </CardContent>
    </Card>
  );
}
