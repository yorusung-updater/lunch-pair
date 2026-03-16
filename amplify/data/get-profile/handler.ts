import type { AppSyncResolverHandler } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import { getUrl } from "aws-amplify/storage";
import { env } from "$amplify/env/get-profile";
import type { Schema } from "../resource";

Amplify.configure(
  {
    API: {
      GraphQL: {
        endpoint: env.AMPLIFY_DATA_GRAPHQL_ENDPOINT,
        region: env.AWS_REGION,
        defaultAuthMode: "iam",
      },
    },
    Storage: {
      S3: {
        bucket: env.AMPLIFY_STORAGE_BUCKET_NAME,
        region: env.AWS_REGION,
      },
    },
  },
  { Auth: { credentialsProvider: { getCredentialsAndIdentityId: async () => ({ credentials: { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY, sessionToken: env.AWS_SESSION_TOKEN } }), clearCredentialsAndIdentityId: () => {} } } }
);

const client = generateClient<Schema>();

type Args = {
  targetUserId: string;
};

export const handler: AppSyncResolverHandler<Args, Schema["ViewableProfile"]["type"]> = async (event) => {
  const callerId = event.identity && "sub" in event.identity ? event.identity.sub : "";
  const { targetUserId } = event.arguments;

  if (!callerId) {
    throw new Error("Unauthorized");
  }

  // Check match status
  const [id1, id2] = [callerId, targetUserId].sort();
  let isMatched = false;

  try {
    const match = await client.models.Match.get({ user1Id: id1, user2Id: id2 });
    isMatched = !!match.data;
  } catch {
    isMatched = false;
  }

  // Fetch target profile
  const profile = await client.models.UserProfile.get({ userId: targetUserId });
  if (!profile.data) {
    throw new Error("Profile not found");
  }

  const p = profile.data;

  // Generate presigned URLs based on match status
  const getPresignedUrl = async (key: string | null | undefined) => {
    if (!key) return null;
    try {
      const result = await getUrl({ path: key, options: { expiresIn: 3600 } });
      return result.url.toString();
    } catch {
      return null;
    }
  };

  const photo2Url = await getPresignedUrl(p.photo2Key);
  const photo3Url = await getPresignedUrl(p.photo3Key);
  const photo4Url = await getPresignedUrl(p.photo4Key);

  // Progressive reveal: photo1 (face) and displayName only visible after match
  const photo1Url = isMatched ? await getPresignedUrl(p.photo1Key) : null;
  const displayName = isMatched ? p.displayName : null;

  return {
    userId: p.userId,
    displayName,
    photo1Url,
    photo2Url,
    photo3Url,
    photo4Url,
    preferences: p.preferences ?? [],
    preferenceFreeText: p.preferenceFreeText ?? null,
    department: p.department ?? null,
    isMatched,
  };
};
