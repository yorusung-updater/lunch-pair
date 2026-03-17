"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
          <Label htmlFor="dept">部署（任意）</Label>
          <Input
            id="dept"
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
            placeholder="例: エンジニアリング"
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}
