"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { toast } from "sonner";
import { useState } from "react";

type Report = {
  id: string;
  reporterId: string;
  reporterName: string | null;
  targetId: string;
  targetName: string | null;
  reason: string;
  detail: string | null;
  status: string;
  createdAt: string;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OPEN: { label: "未対応", color: "bg-red-50 text-red-600" },
  REVIEWED: { label: "確認済み", color: "bg-amber-50 text-amber-600" },
  ACTIONED: { label: "対応済み", color: "bg-green-50 text-green-600" },
};

export default function ReportsPanel() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"ALL" | "OPEN" | "REVIEWED" | "ACTIONED">("ALL");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const result: any = await client.models.Report.list({ limit: 200 });
      const items = (result?.data ?? []) as Report[];
      return items.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
  });

  async function updateStatus(id: string, status: string) {
    try {
      await client.models.Report.update({ id, status });
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast.success("ステータスを更新しました");
    } catch {
      toast.error("更新に失敗しました");
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>
    );
  }

  const filtered =
    filter === "ALL"
      ? reports
      : reports?.filter((r) => r.status === filter);

  const openCount = reports?.filter((r) => r.status === "OPEN").length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">ユーザー通報</h2>
          {openCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
              {openCount}
            </span>
          )}
        </div>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5">
          {(["ALL", "OPEN", "REVIEWED", "ACTIONED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${
                filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              {f === "ALL" ? "全て" : STATUS_LABELS[f].label}
            </button>
          ))}
        </div>
      </div>

      {!filtered || filtered.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-gray-400">
          通報はありません
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const sl = STATUS_LABELS[r.status] ?? STATUS_LABELS.OPEN;
            return (
              <div
                key={r.id}
                className={`rounded-xl bg-white p-4 shadow-sm border-l-4 ${
                  r.status === "OPEN"
                    ? "border-l-red-400"
                    : r.status === "REVIEWED"
                    ? "border-l-amber-400"
                    : "border-l-green-400"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
                        {r.reason}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sl.color}`}>
                        {sl.label}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-gray-500">
                      <span>通報者: <b className="text-gray-700">{r.reporterName || r.reporterId.slice(0, 8)}</b></span>
                      <span>対象: <b className="text-gray-700">{r.targetName || r.targetId.slice(0, 8)}</b></span>
                    </div>
                    {r.detail && (
                      <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-2.5">
                        {r.detail}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-2">
                      {new Date(r.createdAt).toLocaleString("ja-JP")}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {r.status === "OPEN" && (
                      <button
                        onClick={() => updateStatus(r.id, "REVIEWED")}
                        className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-600 hover:bg-amber-100 transition-colors"
                      >
                        確認済み
                      </button>
                    )}
                    {(r.status === "OPEN" || r.status === "REVIEWED") && (
                      <button
                        onClick={() => updateStatus(r.id, "ACTIONED")}
                        className="rounded-lg bg-green-50 px-2.5 py-1.5 text-[11px] font-medium text-green-600 hover:bg-green-100 transition-colors"
                      >
                        対応済み
                      </button>
                    )}
                    {r.status === "ACTIONED" && (
                      <button
                        onClick={() => updateStatus(r.id, "OPEN")}
                        className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-[11px] font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                      >
                        未対応に戻す
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
