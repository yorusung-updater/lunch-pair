import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { QUERY_KEYS } from "@/constants/query-keys";

export function useAdminSwipes() {
  return useQuery({
    queryKey: QUERY_KEYS.adminSwipes,
    queryFn: async () => {
      const r: any = await client.models.Swipe.list({ limit: 1000 });
      return (r?.data ?? []).sort((a: any, b: any) =>
        (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
      );
    },
  });
}
