import type { AppSyncResolverHandler } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import { getUrl } from "aws-amplify/storage";
import { env } from "$amplify/env/get-who-liked-me";
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
  limit?: number;
};

export const handler: AppSyncResolverHandler<Args, Schema["WhoLikedMeConnection"]["type"]> = async (event) => {
  const userId = event.identity && "sub" in event.identity ? event.identity.sub : "";
  const { limit = 20 } = event.arguments;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // 1. Check premium status
  const myProfile = await client.models.UserProfile.get({ userId });
  if (!myProfile.data?.isPremium) {
    return { profiles: JSON.stringify([]), count: 0 };
  }

  // 2. Get swipes targeting me with direction=OK
  const likesResult = await client.models.Swipe.listSwipeByTargetId(
    { targetId: userId },
    { limit: limit * 2 } // over-fetch to allow filtering
  );

  const likers = likesResult.data.filter((s) => s.direction === "OK");

  // 3. Check which ones I have NOT swiped on yet
  const mySwipes = await client.models.Swipe.listSwipeBySwiperId({ swiperId: userId });
  const mySwipedTargets = new Set(mySwipes.data.map((s) => s.targetId));

  const unseenLikers = likers.filter((l) => !mySwipedTargets.has(l.swiperId));

  // 4. Build ViewableProfiles (no face, no name)
  const profiles = await Promise.all(
    unseenLikers.slice(0, limit).map(async (liker) => {
      const profile = await client.models.UserProfile.get({ userId: liker.swiperId });
      if (!profile.data) return null;

      const p = profile.data;
      let photo2Url: string | null = null;

      if (p.photo2Key) {
        try {
          const result = await getUrl({ path: p.photo2Key, options: { expiresIn: 3600 } });
          photo2Url = result.url.toString();
        } catch { /* skip */ }
      }

      return {
        userId: p.userId,
        displayName: null,
        photo1Url: null,
        photo2Url,
        photo3Url: null,
        photo4Url: null,
        preferences: p.preferences ?? [],
        preferenceFreeText: p.preferenceFreeText ?? null,
        department: p.department ?? null,
        isMatched: false,
      };
    })
  );

  const validProfiles = profiles.filter(Boolean);

  return {
    profiles: JSON.stringify(validProfiles),
    count: likers.length, // Total count of people who liked (even unseen)
  };
};
