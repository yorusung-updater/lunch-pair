"use client";

import { useMemo } from "react";
import { useAdminUsers } from "@/hooks/admin/useAdminUsers";
import { useAdminMatches } from "@/hooks/admin/useAdminMatches";
import { useAdminSwipes } from "@/hooks/admin/useAdminSwipes";
import { PREFERENCE_OPTIONS } from "@/constants/preferences";
import { DEPARTMENTS } from "@/constants/dummy-data";

export default function AnalyticsPanel() {
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: matches, isLoading: matchesLoading } = useAdminMatches();
  const { data: swipes, isLoading: swipesLoading } = useAdminSwipes();

  const isLoading = usersLoading || matchesLoading || swipesLoading;

  // --- Section A: Preference Popularity ---
  const preferenceRanking = useMemo(() => {
    if (!users) return [];
    const counts: Record<string, number> = {};
    for (const pref of PREFERENCE_OPTIONS) {
      counts[pref] = 0;
    }
    for (const user of users as any[]) {
      const prefs: string[] = user.preferences ?? [];
      for (const p of prefs) {
        if (p in counts) {
          counts[p]++;
        }
      }
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const max = sorted.length > 0 ? sorted[0][1] : 1;
    return sorted.map(([label, count]) => ({
      label,
      count,
      widthPct: max > 0 ? (count / max) * 100 : 0,
    }));
  }, [users]);

  // --- Section B: Department Match Heatmap ---
  const heatmapData = useMemo(() => {
    if (!users || !matches) return { departments: [] as string[], grid: [] as number[][] };

    const userMap = new Map<string, string>();
    for (const u of users as any[]) {
      if (u.department) {
        userMap.set(u.userId, u.department);
      }
    }

    const activeDepts = DEPARTMENTS.filter((d) =>
      Array.from(userMap.values()).includes(d)
    );

    const deptIndex = new Map<string, number>();
    activeDepts.forEach((d, i) => deptIndex.set(d, i));

    const grid: number[][] = activeDepts.map(() =>
      activeDepts.map(() => 0)
    );

    for (const m of matches as any[]) {
      const d1 = userMap.get(m.user1Id);
      const d2 = userMap.get(m.user2Id);
      if (d1 && d2 && deptIndex.has(d1) && deptIndex.has(d2)) {
        const i = deptIndex.get(d1)!;
        const j = deptIndex.get(d2)!;
        grid[i][j]++;
        if (i !== j) {
          grid[j][i]++;
        }
      }
    }

    return { departments: activeDepts, grid };
  }, [users, matches]);

  // --- Section C: Swipe Funnel ---
  const funnelData = useMemo(() => {
    const totalUsers = (users as any[] | undefined)?.length ?? 0;
    const totalPairs = totalUsers > 1 ? (totalUsers * (totalUsers - 1)) / 2 : 0;
    const totalSwipes = (swipes as any[] | undefined)?.length ?? 0;
    const okSwipes =
      (swipes as any[] | undefined)?.filter((s: any) => s.direction === "OK")
        .length ?? 0;
    const totalMatches = (matches as any[] | undefined)?.length ?? 0;

    const steps = [
      {
        label: "全ユーザーペア",
        count: totalPairs,
        rate: null as string | null,
        color: "bg-gray-200",
        widthPct: 100,
      },
      {
        label: "スワイプ済み",
        count: totalSwipes,
        rate: totalPairs > 0 ? ((totalSwipes / totalPairs) * 100).toFixed(1) + "%" : "0%",
        color: "bg-blue-300",
        widthPct: 80,
      },
      {
        label: "いいかも",
        count: okSwipes,
        rate: totalSwipes > 0 ? ((okSwipes / totalSwipes) * 100).toFixed(1) + "%" : "0%",
        color: "bg-orange-300",
        widthPct: 60,
      },
      {
        label: "マッチ成立",
        count: totalMatches,
        rate: okSwipes > 0 ? ((totalMatches / okSwipes) * 100).toFixed(1) + "%" : "0%",
        color: "bg-green-400",
        widthPct: 40,
      },
    ];

    return steps;
  }, [users, swipes, matches]);

  // --- Section D: Daily Activity (last 7 days) ---
  const dailyActivity = useMemo(() => {
    const today = new Date();
    const days: { date: string; label: string; count: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      days.push({ date: dateStr, label: `${mm}/${dd}`, count: 0 });
    }

    if (swipes) {
      for (const s of swipes as any[]) {
        if (!s.createdAt) continue;
        const dateStr = s.createdAt.slice(0, 10);
        const day = days.find((d) => d.date === dateStr);
        if (day) {
          day.count++;
        }
      }
    }

    const maxCount = Math.max(...days.map((d) => d.count), 1);
    return { days, maxCount };
  }, [swipes]);

  // --- Heatmap cell color ---
  const heatmapColor = (count: number): string => {
    if (count >= 6) return "bg-orange-400 text-white";
    if (count >= 4) return "bg-orange-300 text-gray-800";
    if (count >= 2) return "bg-orange-200 text-gray-800";
    if (count >= 1) return "bg-orange-100 text-gray-800";
    return "bg-orange-50 text-gray-400";
  };

  const abbreviate = (name: string, maxLen = 6): string => {
    return name.length > maxLen ? name.slice(0, maxLen) + ".." : name;
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-400">読み込み中...</div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">アナリティクス</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section A: Preference Popularity */}
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100 space-y-3">
          <h3 className="text-base font-bold text-gray-800 mb-3">
            こだわり人気ランキング
          </h3>
          {preferenceRanking.length === 0 ? (
            <p className="text-sm text-gray-400">データがありません</p>
          ) : (
            <div className="space-y-2">
              {preferenceRanking.map(({ label, count, widthPct }) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <span className="w-20 shrink-0 text-gray-700 truncate">
                    {label}
                  </span>
                  <div className="flex-1 h-5 bg-gray-50 rounded overflow-hidden">
                    <div
                      className="h-full bg-orange-400 rounded transition-all"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-gray-600 font-medium shrink-0">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section B: Department Match Heatmap */}
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100 space-y-3">
          <h3 className="text-base font-bold text-gray-800 mb-3">
            本部間マッチヒートマップ
          </h3>
          {heatmapData.departments.length === 0 ? (
            <p className="text-sm text-gray-400">データがありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse w-full">
                <thead>
                  <tr>
                    <th className="p-1" />
                    {heatmapData.departments.map((dept) => (
                      <th
                        key={dept}
                        className="p-1 text-gray-500 font-normal text-center"
                        title={dept}
                      >
                        <span className="inline-block max-w-[4rem] truncate text-[10px]">
                          {abbreviate(dept)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.departments.map((rowDept, i) => (
                    <tr key={rowDept}>
                      <td
                        className="p-1 text-gray-500 text-right pr-2 max-w-[5rem] truncate text-[10px]"
                        title={rowDept}
                      >
                        {abbreviate(rowDept)}
                      </td>
                      {heatmapData.grid[i].map((count, j) => (
                        <td
                          key={j}
                          className={`p-1 text-center w-9 h-9 rounded ${heatmapColor(count)}`}
                        >
                          {count}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section C: Swipe Funnel */}
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100 space-y-3">
          <h3 className="text-base font-bold text-gray-800 mb-3">
            スワイプファネル
          </h3>
          <div className="space-y-2">
            {funnelData.map((step, idx) => (
              <div key={step.label}>
                <div
                  className={`${step.color} rounded-lg py-2 px-3 flex items-center justify-between text-sm transition-all`}
                  style={{ width: `${step.widthPct}%`, minWidth: "60%" }}
                >
                  <span className="font-medium text-gray-800 truncate">
                    {step.label}
                  </span>
                  <span className="font-bold text-gray-900 shrink-0 ml-2">
                    {step.count.toLocaleString()}
                  </span>
                </div>
                {step.rate !== null && (
                  <span className="text-xs text-gray-400 mt-0.5 ml-1">
                    {idx > 0 ? `↑ ${step.rate}` : step.rate}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section D: Daily Activity */}
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100 space-y-3">
          <h3 className="text-base font-bold text-gray-800 mb-3">
            日別アクティビティ
          </h3>
          {dailyActivity.days.every((d) => d.count === 0) ? (
            <p className="text-sm text-gray-400">データがありません</p>
          ) : null}
          <div className="flex items-end justify-between gap-1" style={{ height: 160 }}>
            {dailyActivity.days.map(({ label, count }) => {
              const heightPct =
                dailyActivity.maxCount > 0
                  ? (count / dailyActivity.maxCount) * 100
                  : 0;
              return (
                <div
                  key={label}
                  className="flex-1 flex flex-col items-center justify-end h-full"
                >
                  <span className="text-xs text-gray-600 font-medium mb-1">
                    {count}
                  </span>
                  <div
                    className="w-full bg-blue-400 rounded-t transition-all"
                    style={{
                      height: count > 0 ? `${Math.max(heightPct, 4)}%` : "2px",
                    }}
                  />
                  <span className="text-xs text-gray-400 mt-1">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
