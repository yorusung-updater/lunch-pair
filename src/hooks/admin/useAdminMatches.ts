import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { QUERY_KEYS } from "@/constants/query-keys";

export function useAdminMatches() {
  return useQuery({
    queryKey: QUERY_KEYS.adminMatches,
    queryFn: async () => {
      const r: any = await client.models.Match.list({ limit: 1000 });
      return r?.data ?? [];
    },
  });
}
