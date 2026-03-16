import type { AppSyncResolverHandler } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import { getUrl } from "aws-amplify/storage";
import { env } from "$amplify/env/get-candidates";
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
  department?: string;
  limit?: number;
  nextToken?: string;
};

export const handler: AppSyncResolverHandler<Args, Schema["CandidateConnection"]["type"]> = async (event) => {
  const userId = event.identity && "sub" in event.identity ? event.identity.sub : "";
  const { department, limit = 20 } = event.arguments;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // 1. Get all users who I have already swiped on
  const swipedIds = new Set<string>();
  let swipeNextToken: string | null | undefined = undefined;
  do {
    const swipes = await client.models.Swipe.listSwipeBySwiperId(
      { swiperId: userId },
      { nextToken: swipeNextToken ?? undefined }
    );
    for (const s of swipes.data) {
      swipedIds.add(s.targetId);
    }
    swipeNextToken = swipes.nextToken;
  } while (swipeNextToken);

  swipedIds.add(userId); // Exclude self

  // 2. Get candidate profiles
  let profiles;
  if (department) {
    profiles = await client.models.UserProfile.listUserProfileByDepartment(
      { department },
      { limit: limit + swipedIds.size }
    );
  } else {
    profiles = await client.models.UserProfile.list({
      limit: limit + swipedIds.size,
    });
  }

  // 3. Filter out already swiped
  const candidates = profiles.data.filter((p) => !swipedIds.has(p.userId));

  // 4. Build ViewableProfiles (progressive reveal: only photo2, NO name or face)
  const viewableProfiles = await Promise.all(
    candidates.slice(0, limit).map(async (p) => {
      let photo2Url: string | null = null;
      let photo3Url: string | null = null;
      let photo4Url: string | null = null;

      if (p.photo2Key) {
        try {
          const result = await getUrl({ path: p.photo2Key, options: { expiresIn: 3600 } });
          photo2Url = result.url.toString();
        } catch { /* skip */ }
      }
      if (p.photo3Key) {
        try {
          const result = await getUrl({ path: p.photo3Key, options: { expiresIn: 3600 } });
          photo3Url = result.url.toString();
        } catch { /* skip */ }
      }
      if (p.photo4Key) {
        try {
          const result = await getUrl({ path: p.photo4Key, options: { expiresIn: 3600 } });
          photo4Url = result.url.toString();
        } catch { /* skip */ }
      }

      return {
        userId: p.userId,
        displayName: null, // Hidden before match
        photo1Url: null, // Face hidden before match
        photo2Url,
        photo3Url,
        photo4Url,
        preferences: p.preferences ?? [],
        preferenceFreeText: p.preferenceFreeText ?? null,
        department: p.department ?? null,
        isMatched: false,
      };
    })
  );

  return {
    profiles: JSON.stringify(viewableProfiles),
    nextToken: profiles.nextToken ?? null,
  };
};
