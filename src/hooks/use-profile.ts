import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUrl } from "aws-amplify/storage";
import { client } from "@/lib/api-client";
import { QUERY_KEYS } from "@/constants/query-keys";
import { compressAndUpload } from "@/utils/photo-upload";
import { toast } from "sonner";

async function getPhotoUrl(key: string | null | undefined): Promise<string | null> {
  if (!key) return null;
  try {
    const r = await getUrl({ path: key, options: { expiresIn: 3600 } });
    return r.url.toString();
  } catch {
    return null;
  }
}

export function useMyProfile(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.myProfile(userId),
    queryFn: async () => {
      const result: any = await client.models.UserProfile.get({ userId });
      if (!result?.data) return null;
      const p = result.data;
      return {
        ...p,
        photo1Url: await getPhotoUrl(p.photo1Key),
        photo2Url: await getPhotoUrl(p.photo2Key),
        photo3Url: await getPhotoUrl(p.photo3Key),
        photo4Url: await getPhotoUrl(p.photo4Key),
      };
    },
  });
}

export function usePhotoUpdate(userId: string) {
  const queryClient = useQueryClient();

  return async (
    photoField: "photo1Key" | "photo2Key" | "photo3Key" | "photo4Key",
    file: File
  ) => {
    try {
      const key = await compressAndUpload(file, `${photoField.replace("Key", "")}.jpg`);
      await client.models.UserProfile.update({ userId, [photoField]: key });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myProfile(userId) });
      toast.success("写真を更新しました");
    } catch {
      toast.error("写真の更新に失敗しました");
    }
  };
}
