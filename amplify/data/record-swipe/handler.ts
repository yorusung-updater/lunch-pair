import type { AppSyncResolverHandler } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import { env } from "$amplify/env/record-swipe";
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
  },
  { Auth: { credentialsProvider: { getCredentialsAndIdentityId: async () => ({ credentials: { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY, sessionToken: env.AWS_SESSION_TOKEN } }), clearCredentialsAndIdentityId: () => {} } } }
);

const client = generateClient<Schema>();

type Args = {
  targetId: string;
  direction: "OK" | "SKIP";
};

export const handler: AppSyncResolverHandler<Args, Schema["RecordSwipeResponse"]["type"]> = async (event) => {
  const swiperId = event.identity && "sub" in event.identity ? event.identity.sub : "";
  const { targetId, direction } = event.arguments;

  if (!swiperId) {
    throw new Error("Unauthorized");
  }

  // 1. Record the swipe
  try {
    await client.models.Swipe.create({
      swiperId,
      targetId,
      direction,
    });
  } catch (err: unknown) {
    // Duplicate swipe - already swiped on this person
    if (err instanceof Error && err.message?.includes("ConditionalCheckFailedException")) {
      return { swipeRecorded: false, isMatch: false, matchedUserId: null };
    }
    throw err;
  }

  // 2. If SKIP, no need to check for match
  if (direction === "SKIP") {
    return { swipeRecorded: true, isMatch: false, matchedUserId: null };
  }

  // 3. Check if target already OK'd us (reverse swipe)
  try {
    const reverseSwipe = await client.models.Swipe.get({
      swiperId: targetId,
      targetId: swiperId,
    });

    if (!reverseSwipe.data || reverseSwipe.data.direction !== "OK") {
      return { swipeRecorded: true, isMatch: false, matchedUserId: null };
    }
  } catch {
    return { swipeRecorded: true, isMatch: false, matchedUserId: null };
  }

  // 4. Mutual OK! Create a Match record
  const [user1Id, user2Id] = [swiperId, targetId].sort();

  try {
    // Fetch display names for denormalization
    const [user1Profile, user2Profile] = await Promise.all([
      client.models.UserProfile.get({ userId: user1Id }),
      client.models.UserProfile.get({ userId: user2Id }),
    ]);

    await client.models.Match.create({
      user1Id,
      user2Id,
      user1DisplayName: user1Profile.data?.displayName ?? "",
      user2DisplayName: user2Profile.data?.displayName ?? "",
    });

    return { swipeRecorded: true, isMatch: true, matchedUserId: targetId };
  } catch (err: unknown) {
    // Match already exists (race condition handled gracefully)
    if (err instanceof Error && err.message?.includes("ConditionalCheckFailedException")) {
      return { swipeRecorded: true, isMatch: true, matchedUserId: targetId };
    }
    throw err;
  }
};
