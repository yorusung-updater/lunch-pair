"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIVISIONS } from "@/constants/divisions";

export default function BasicInfoSection({
  displayName,
  department,
  onNameChange,
  onDepartmentChange,
}: {
  displayName: string;
  department: string;
  onNameChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
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
      </CardContent>
    </Card>
  );
}
