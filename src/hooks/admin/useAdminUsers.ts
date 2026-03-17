import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { QUERY_KEYS } from "@/constants/query-keys";

export function useAdminUsers() {
  return useQuery({
    queryKey: QUERY_KEYS.adminUsers,
    queryFn: async () => {
      const r: any = await client.models.UserProfile.list({ limit: 1000 });
      return r?.data ?? [];
    },
  });
}
