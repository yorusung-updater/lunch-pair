"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { toast } from "sonner";
import { useState } from "react";

type Inquiry = {
  id: string;
  userId: string;
  displayName: string | null;
  category: string | null;
  message: string;
  status: string;
  createdAt: string;
};

export default function InquiriesPanel() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"ALL" | "OPEN" | "CLOSED">("ALL");

  const { data: inquiries, isLoading, error } = useQuery({
    queryKey: ["admin-inquiries"],
    queryFn: async () => {
      try {
        const result: any = await client.models.Inquiry?.list?.({ limit: 200 });
        const items = (result?.data ?? []) as Inquiry[];
        return items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } catch (err) {
        console.error("Error loading inquiries:", err);
        throw err;
      }
    },
  });

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "OPEN" ? "CLOSED" : "OPEN";
    try {
      await client.models.Inquiry.update({ id, status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] });
      toast.success(newStatus === "CLOSED" ? "対応済みにしました" : "未対応に戻しました");
    } catch {
      toast.error("更新に失敗しました");
    }
  }

  async function deleteInquiry(id: string) {
    try {
      await client.models.Inquiry.delete({ id });
      queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] });
      toast.success("削除しました");
    } catch {
      toast.error("削除に失敗しました");
    }
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600">データの読み込みに失敗しました</p>
        <p className="text-xs text-red-400 mt-1">{error instanceof Error ? error.message : "Unknown error"}</p>
      </div>
    );
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
      ? inquiries
      : inquiries?.filter((i) => i.status === filter);

  const openCount = inquiries?.filter((i) => i.status === "OPEN").length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">お問い合わせ</h2>
          {openCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
              {openCount}
            </span>
          )}
        </div>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5">
          {(["ALL", "OPEN", "CLOSED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              {f === "ALL" ? "すべて" : f === "OPEN" ? "未対応" : "対応済み"}
            </button>
          ))}
        </div>
      </div>

      {!filtered || filtered.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-gray-400">
          {filter === "OPEN" ? "未対応のお問い合わせはありません" : "お問い合わせはありません"}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inq) => (
            <div
              key={inq.id}
              className={`rounded-xl bg-white p-4 shadow-sm border-l-4 ${
                inq.status === "OPEN" ? "border-l-red-400" : "border-l-green-400"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">
                      {inq.displayName || "名前なし"}
                    </span>
                    {inq.category && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                        {inq.category}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        inq.status === "OPEN"
                          ? "bg-red-50 text-red-600"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      {inq.status === "OPEN" ? "未対応" : "対応済み"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(inq.createdAt).toLocaleString("ja-JP")} / ID: {inq.userId.slice(0, 8)}...
                  </p>
                  <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap leading-relaxed">
                    {inq.message}
                  </p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => toggleStatus(inq.id, inq.status)}
                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                      inq.status === "OPEN"
                        ? "bg-green-50 text-green-600 hover:bg-green-100"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {inq.status === "OPEN" ? "対応済み" : "未対応に戻す"}
                  </button>
                  <button
                    onClick={() => deleteInquiry(inq.id)}
                    className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-[11px] font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
