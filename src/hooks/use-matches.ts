import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { QUERY_KEYS } from "@/constants/query-keys";
import type { MatchEntry } from "@/types";

export function useMatches(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.matches(userId),
    queryFn: async () => {
      const [r1, r2]: any[] = await Promise.all([
        client.models.Match.listMatchByUser1Id({ user1Id: userId }),
        client.models.Match.listMatchByUser2Id({ user2Id: userId }),
      ]);
      const raw = [
        ...(r1?.data ?? []).map((m: any) => ({
          matchedUserId: m.user2Id,
          displayName: m.user2DisplayName ?? "?",
          matchedAt: m.createdAt,
        })),
        ...(r2?.data ?? []).map((m: any) => ({
          matchedUserId: m.user1Id,
          displayName: m.user1DisplayName ?? "?",
          matchedAt: m.createdAt,
        })),
      ];
      const all: MatchEntry[] = await Promise.all(
        raw.map(async (m: any) => {
          try {
            const p: any = await client.queries.getProfileForViewing({ targetUserId: m.matchedUserId });
            return { ...m, photoUrl: p?.data?.photo1Url ?? null };
          } catch {
            return { ...m, photoUrl: null };
          }
        })
      );
      return all.sort((a, b) =>
        (b.matchedAt ?? "").localeCompare(a.matchedAt ?? "")
      );
    },
  });
}
