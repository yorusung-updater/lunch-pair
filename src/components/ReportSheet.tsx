"use client";

import { useState } from "react";
import { client } from "@/lib/api-client";
import { toast } from "sonner";

const REPORT_REASONS = [
  "不適切なメッセージ",
  "なりすまし・偽プロフィール",
  "不快な写真",
  "スパム・宣伝行為",
  "ハラスメント・嫌がらせ",
  "個人情報の悪用",
  "ドタキャン・無断キャンセル",
  "その他",
] as const;

export default function ReportSheet({
  reporterId,
  reporterName,
  targetId,
  targetName,
  onClose,
}: {
  reporterId: string;
  reporterName: string;
  targetId: string;
  targetName: string;
  onClose: () => void;
}) {
  const [selectedReason, setSelectedReason] = useState("");
  const [detail, setDetail] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!selectedReason) return;
    setSending(true);
    try {
      await client.models.Report.create({
        reporterId,
        reporterName,
        targetId,
        targetName,
        reason: selectedReason,
        detail: detail.trim() || undefined,
        status: "OPEN",
      });
      toast.success("通報を送信しました。ご報告ありがとうございます。");
      onClose();
    } catch {
      toast.error("送信に失敗しました");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-red-600">ユーザーを通報</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          {targetName} さんを通報します。通報内容は運営チームが確認します。
        </p>

        {/* Reason chips */}
        <p className="text-xs font-medium text-gray-500 mb-2">通報理由を選択</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => setSelectedReason(reason)}
              className={`rounded-full px-3 py-1.5 text-xs transition-all ${
                selectedReason === reason
                  ? "bg-red-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {reason}
            </button>
          ))}
        </div>

        {/* Detail */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-500">詳細（任意）</label>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="具体的な状況を教えていただけると対応がスムーズです..."
            rows={3}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 resize-none"
          />
        </div>

        {/* Submit */}
        <button
          onClick={submit}
          disabled={!selectedReason || sending}
          className="w-full rounded-xl bg-red-500 py-3 text-sm font-semibold text-white active:scale-[0.98] transition-all disabled:bg-gray-200 disabled:text-gray-400"
        >
          {sending ? "送信中..." : "通報する"}
        </button>
      </div>
    </div>
  );
}
