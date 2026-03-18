"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAdminUsers } from "@/hooks/admin/useAdminUsers";
import { useAdminMatches } from "@/hooks/admin/useAdminMatches";
import { useAdminSwipes } from "@/hooks/admin/useAdminSwipes";
import { QUERY_KEYS } from "@/constants/query-keys";
import {
  simulateSwipe,
  generateDummyUsers,
  generateRandomSwipes,
  resetAll,
  resetAllSwipes,
  resetAllMatches,
  getCandidatesForUser,
  getPendingOks,
} from "@/utils/simulation";

export default function SimulationPanel() {
  const queryClient = useQueryClient();
  const { data: users } = useAdminUsers();
  const { data: matches } = useAdminMatches();
  const { data: swipes } = useAdminSwipes();

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminMatches });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminSwipes });
  }, [queryClient]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">シミュレーション</h2>
      <BulkSwipeSection users={users ?? []} invalidateAll={invalidateAll} />
      <RandomGenerationSection users={users ?? []} invalidateAll={invalidateAll} />
      <DeckPreviewSection users={users ?? []} swipes={swipes ?? []} />
      <PendingOksSection
        users={users ?? []}
        swipes={swipes ?? []}
        matches={matches ?? []}
        invalidateAll={invalidateAll}
      />
      <DataResetSection invalidateAll={invalidateAll} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section A: Bulk Swipe
// ---------------------------------------------------------------------------
function BulkSwipeSection({
  users,
  invalidateAll,
}: {
  users: any[];
  invalidateAll: () => void;
}) {
  const [userA, setUserA] = useState("");
  const [userB, setUserB] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSwipe(mode: "a2b" | "b2a" | "mutual") {
    if (!userA || !userB) {
      toast.error("ユーザーAとBを選択してください");
      return;
    }
    if (userA === userB) {
      toast.error("異なるユーザーを選択してください");
      return;
    }
    setLoading(true);
    try {
      if (mode === "a2b") {
        const res = await simulateSwipe(userA, userB, "OK");
        if (res.isMatch) toast.success("マッチが成立しました!");
        else toast.success("A→B いいかも送信完了");
      } else if (mode === "b2a") {
        const res = await simulateSwipe(userB, userA, "OK");
        if (res.isMatch) toast.success("マッチが成立しました!");
        else toast.success("B→A いいかも送信完了");
      } else {
        await simulateSwipe(userA, userB, "OK");
        const res = await simulateSwipe(userB, userA, "OK");
        if (res.isMatch) toast.success("相互マッチが成立しました!");
        else toast.success("相互スワイプ送信完了");
      }
      invalidateAll();
    } catch {
      toast.error("スワイプに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
      <h3 className="text-base font-bold text-gray-800 mb-3">バルクスワイプ</h3>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">User A</label>
          <select
            value={userA}
            onChange={(e) => setUserA(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">選択...</option>
            {users.map((u: any) => (
              <option key={u.userId} value={u.userId}>
                {u.displayName} ({u.department || "部署なし"})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">User B</label>
          <select
            value={userB}
            onChange={(e) => setUserB(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">選択...</option>
            {users.map((u: any) => (
              <option key={u.userId} value={u.userId}>
                {u.displayName} ({u.department || "部署なし"})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          disabled={loading}
          onClick={() => handleSwipe("a2b")}
          className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "..." : "A→B いいかも"}
        </button>
        <button
          disabled={loading}
          onClick={() => handleSwipe("b2a")}
          className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "..." : "B→A いいかも"}
        </button>
        <button
          disabled={loading}
          onClick={() => handleSwipe("mutual")}
          className="rounded-lg bg-pink-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-pink-600 disabled:opacity-50"
        >
          {loading ? "..." : "相互マッチ"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section B: Random Generation
// ---------------------------------------------------------------------------
function RandomGenerationSection({
  users,
  invalidateAll,
}: {
  users: any[];
  invalidateAll: () => void;
}) {
  const [swipeCount, setSwipeCount] = useState(50);
  const [okRatio, setOkRatio] = useState(60);
  const [swipeProgress, setSwipeProgress] = useState<{ current: number; total: number; matches: number } | null>(null);
  const [swipeResult, setSwipeResult] = useState<{ swipes: number; matches: number } | null>(null);
  const [swipeLoading, setSwipeLoading] = useState(false);

  const [dummyCount, setDummyCount] = useState(10);
  const [dummyProgress, setDummyProgress] = useState<{ current: number; total: number } | null>(null);
  const [dummyLoading, setDummyLoading] = useState(false);

  async function handleGenerateSwipes() {
    const userIds = users.map((u: any) => u.userId);
    if (userIds.length < 2) {
      toast.error("ユーザーが2人以上必要です");
      return;
    }
    setSwipeLoading(true);
    setSwipeResult(null);
    setSwipeProgress({ current: 0, total: swipeCount, matches: 0 });
    try {
      const result = await generateRandomSwipes(userIds, swipeCount, okRatio / 100, (current, total, matches) => {
        setSwipeProgress({ current, total, matches });
      });
      setSwipeResult(result);
      toast.success(`${result.swipes} スワイプ生成、${result.matches} マッチ成立`);
      invalidateAll();
    } catch {
      toast.error("スワイプ生成に失敗しました");
    } finally {
      setSwipeLoading(false);
      setSwipeProgress(null);
    }
  }

  async function handleGenerateDummy() {
    setDummyLoading(true);
    setDummyProgress({ current: 0, total: dummyCount });
    try {
      const created = await generateDummyUsers(dummyCount, (current, total) => {
        setDummyProgress({ current, total });
      });
      toast.success(`${created} ダミーユーザーを生成しました`);
      invalidateAll();
    } catch {
      toast.error("ダミーユーザー生成に失敗しました");
    } finally {
      setDummyLoading(false);
      setDummyProgress(null);
    }
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
      <h3 className="text-base font-bold text-gray-800 mb-3">ランダム生成</h3>

      {/* Random Swipes */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-600 mb-2">ランダムスワイプ</p>
        <div className="flex items-center gap-3 mb-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">スワイプ数</label>
            <input
              type="number"
              min={1}
              value={swipeCount}
              onChange={(e) => setSwipeCount(Number(e.target.value) || 1)}
              className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">OK率: {okRatio}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={okRatio}
              onChange={(e) => setOkRatio(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        {swipeProgress && (
          <div className="mb-2">
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${(swipeProgress.current / swipeProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {swipeProgress.current}/{swipeProgress.total} (マッチ: {swipeProgress.matches})
            </p>
          </div>
        )}
        {swipeResult && !swipeProgress && (
          <p className="text-xs text-green-600 mb-2">
            {swipeResult.swipes} スワイプ生成、{swipeResult.matches} マッチ成立
          </p>
        )}
        <button
          disabled={swipeLoading}
          onClick={handleGenerateSwipes}
          className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {swipeLoading ? "生成中..." : "ランダムスワイプ生成"}
        </button>
      </div>

      {/* Dummy Users */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">ダミーユーザー生成</p>
        <div className="flex items-center gap-3 mb-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">人数</label>
            <input
              type="number"
              min={1}
              value={dummyCount}
              onChange={(e) => setDummyCount(Number(e.target.value) || 1)}
              className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
            />
          </div>
        </div>
        {dummyProgress && (
          <div className="mb-2">
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${(dummyProgress.current / dummyProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {dummyProgress.current}/{dummyProgress.total}
            </p>
          </div>
        )}
        <button
          disabled={dummyLoading}
          onClick={handleGenerateDummy}
          className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
        >
          {dummyLoading ? "生成中..." : "ダミーユーザー生成"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section C: Deck Preview
// ---------------------------------------------------------------------------
function DeckPreviewSection({
  users,
  swipes,
}: {
  users: any[];
  swipes: any[];
}) {
  const [selectedUser, setSelectedUser] = useState("");

  const candidates = selectedUser ? getCandidatesForUser(selectedUser, users, swipes) : [];

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
      <h3 className="text-base font-bold text-gray-800 mb-3">デッキプレビュー</h3>
      <div className="mb-3">
        <label className="block text-xs text-gray-500 mb-1">ユーザーを選択</label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">選択...</option>
          {users.map((u: any) => (
            <option key={u.userId} value={u.userId}>
              {u.displayName} ({u.department || "部署なし"})
            </option>
          ))}
        </select>
      </div>
      {selectedUser && (
        <div className="max-h-72 overflow-y-auto space-y-2">
          {candidates.length === 0 ? (
            <p className="text-xs text-gray-400">候補がいません</p>
          ) : (
            candidates.map(({ user: c, matchCount }) => (
              <div
                key={c.userId}
                className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600 shrink-0">
                  {(c.displayName || "?").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.displayName}</p>
                  <p className="text-[10px] text-gray-400 truncate">{c.department || "部署なし"}</p>
                  {(c.preferences as string[] | undefined)?.length ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(c.preferences as string[]).map((p: string) => (
                        <span
                          key={p}
                          className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-500"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                {matchCount > 0 && (
                  <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                    共通 {matchCount}件
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section D: Pending OKs Matrix
// ---------------------------------------------------------------------------
function PendingOksSection({
  users,
  swipes,
  matches,
  invalidateAll,
}: {
  users: any[];
  swipes: any[];
  matches: any[];
  invalidateAll: () => void;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const pendingOks = getPendingOks(swipes, matches);

  const userMap = new Map<string, string>();
  for (const u of users) {
    userMap.set(u.userId, u.displayName || u.userId.slice(0, 8));
  }

  async function handleComplete(targetId: string, swiperId: string) {
    const key = `${targetId}_${swiperId}`;
    setLoadingId(key);
    try {
      const res = await simulateSwipe(targetId, swiperId, "OK");
      if (res.isMatch) toast.success("マッチが成立しました!");
      else toast.success("いいかも送信完了");
      invalidateAll();
    } catch {
      toast.error("操作に失敗しました");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
      <h3 className="text-base font-bold text-gray-800 mb-3">
        マッチ待ち一覧
        {pendingOks.length > 0 && (
          <span className="ml-2 text-xs font-normal text-gray-400">{pendingOks.length}件</span>
        )}
      </h3>
      {pendingOks.length === 0 ? (
        <p className="text-xs text-gray-400">片思いスワイプはありません</p>
      ) : (
        <div className="max-h-72 overflow-y-auto space-y-2">
          {pendingOks.map((p) => {
            const key = `${p.targetId}_${p.swiperId}`;
            return (
              <div
                key={`${p.swiperId}_${p.targetId}`}
                className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm"
              >
                <span className="font-medium truncate">{userMap.get(p.swiperId) ?? p.swiperId.slice(0, 8)}</span>
                <span className="text-gray-400">→</span>
                <span className="font-medium truncate">{userMap.get(p.targetId) ?? p.targetId.slice(0, 8)}</span>
                <button
                  disabled={loadingId === key}
                  onClick={() => handleComplete(p.targetId, p.swiperId)}
                  className="ml-auto shrink-0 rounded-lg bg-pink-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-pink-600 disabled:opacity-50"
                >
                  {loadingId === key ? "..." : "相手もOKにする"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section E: Data Reset
// ---------------------------------------------------------------------------
function DataResetSection({ invalidateAll }: { invalidateAll: () => void }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ phase: string; count: number } | null>(null);

  async function handleResetSwipes() {
    if (!window.confirm("全スワイプを削除しますか？この操作は取り消せません。")) return;
    setLoading("swipes");
    setProgress(null);
    try {
      const count = await resetAllSwipes((n) => setProgress({ phase: "スワイプ", count: n }));
      toast.success(`${count} スワイプを削除しました`);
      invalidateAll();
    } catch {
      toast.error("削除に失敗しました");
    } finally {
      setLoading(null);
      setProgress(null);
    }
  }

  async function handleResetMatches() {
    if (!window.confirm("全マッチを削除しますか？この操作は取り消せません。")) return;
    setLoading("matches");
    setProgress(null);
    try {
      const count = await resetAllMatches((n) => setProgress({ phase: "マッチ", count: n }));
      toast.success(`${count} マッチを削除しました`);
      invalidateAll();
    } catch {
      toast.error("削除に失敗しました");
    } finally {
      setLoading(null);
      setProgress(null);
    }
  }

  async function handleResetAll() {
    if (!window.confirm("全データ（メッセージ・マッチ・スワイプ）を削除しますか？この操作は取り消せません。")) return;
    setLoading("all");
    setProgress(null);
    try {
      await resetAll((phase, n) => setProgress({ phase, count: n }));
      toast.success("全データをリセットしました");
      invalidateAll();
    } catch {
      toast.error("リセットに失敗しました");
    } finally {
      setLoading(null);
      setProgress(null);
    }
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
      <h3 className="text-base font-bold text-gray-800 mb-3">データリセット</h3>
      {progress && (
        <p className="text-xs text-gray-500 mb-2">
          {progress.phase} 削除中... ({progress.count} 件削除済み)
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          disabled={loading !== null}
          onClick={handleResetSwipes}
          className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
        >
          {loading === "swipes" ? "削除中..." : "全スワイプ削除"}
        </button>
        <button
          disabled={loading !== null}
          onClick={handleResetMatches}
          className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
        >
          {loading === "matches" ? "削除中..." : "全マッチ削除"}
        </button>
        <button
          disabled={loading !== null}
          onClick={handleResetAll}
          className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-50"
        >
          {loading === "all" ? "リセット中..." : "全データリセット"}
        </button>
      </div>
    </div>
  );
}
