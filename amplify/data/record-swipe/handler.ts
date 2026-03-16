import type { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const SWIPE_TABLE = process.env.SWIPE_TABLE!;
const MATCH_TABLE = process.env.MATCH_TABLE!;
const USERPROFILE_TABLE = process.env.USERPROFILE_TABLE!;

const FREE_DAILY_SWIPE_LIMIT = 3;

type Args = {
  targetId: string;
  direction: "OK" | "SKIP";
};

type Result = {
  swipeRecorded: boolean;
  isMatch: boolean;
  matchedUserId: string | null;
  dailySwipesRemaining: number | null;
};

export const handler: AppSyncResolverHandler<Args, Result> = async (event) => {
  const swiperId =
    event.identity && "sub" in event.identity ? event.identity.sub : "";
  const { targetId, direction } = event.arguments;

  if (!swiperId) throw new Error("Unauthorized");

  // 0. Check daily swipe limit for free users
  const callerProfile = await ddb.send(
    new GetCommand({ TableName: USERPROFILE_TABLE, Key: { userId: swiperId } })
  );

  let dailySwipesRemaining: number | null = null;

  if (!callerProfile.Item?.hasUnlimitedSwipe) {
    const today = new Date().toISOString().slice(0, 10);
    const todaySwipes = await ddb.send(
      new QueryCommand({
        TableName: SWIPE_TABLE,
        IndexName: "swipesBySwiperIdAndTargetId",
        KeyConditionExpression: "swiperId = :sid",
        FilterExpression: "begins_with(createdAt, :today)",
        ExpressionAttributeValues: {
          ":sid": swiperId,
          ":today": today,
        },
        Select: "COUNT",
      })
    );
    const count = todaySwipes.Count ?? 0;
    if (count >= FREE_DAILY_SWIPE_LIMIT) {
      return {
        swipeRecorded: false,
        isMatch: false,
        matchedUserId: null,
        dailySwipesRemaining: 0,
      };
    }
    dailySwipesRemaining = FREE_DAILY_SWIPE_LIMIT - count - 1;
  }

  // 1. Record the swipe (conditional: prevent duplicates)
  try {
    await ddb.send(
      new PutCommand({
        TableName: SWIPE_TABLE,
        Item: {
          swiperId,
          targetId,
          direction,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ConditionExpression:
          "attribute_not_exists(swiperId) AND attribute_not_exists(targetId)",
      })
    );
  } catch (err: any) {
    if (err.name === "ConditionalCheckFailedException") {
      return { swipeRecorded: false, isMatch: false, matchedUserId: null, dailySwipesRemaining };
    }
    throw err;
  }

  // 2. If SKIP, done
  if (direction === "SKIP") {
    return { swipeRecorded: true, isMatch: false, matchedUserId: null, dailySwipesRemaining };
  }

  // 3. Check reverse swipe (did target already OK us?)
  const reverse = await ddb.send(
    new GetCommand({
      TableName: SWIPE_TABLE,
      Key: { swiperId: targetId, targetId: swiperId },
    })
  );

  if (!reverse.Item || reverse.Item.direction !== "OK") {
    return { swipeRecorded: true, isMatch: false, matchedUserId: null, dailySwipesRemaining };
  }

  // 4. Mutual OK! Create Match
  const [user1Id, user2Id] = [swiperId, targetId].sort();

  const [u1, u2] = await Promise.all([
    ddb.send(new GetCommand({ TableName: USERPROFILE_TABLE, Key: { userId: user1Id } })),
    ddb.send(new GetCommand({ TableName: USERPROFILE_TABLE, Key: { userId: user2Id } })),
  ]);

  try {
    await ddb.send(
      new PutCommand({
        TableName: MATCH_TABLE,
        Item: {
          user1Id,
          user2Id,
          user1DisplayName: u1.Item?.displayName ?? "",
          user2DisplayName: u2.Item?.displayName ?? "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ConditionExpression:
          "attribute_not_exists(user1Id) AND attribute_not_exists(user2Id)",
      })
    );
  } catch (err: any) {
    if (err.name === "ConditionalCheckFailedException") {
      return { swipeRecorded: true, isMatch: true, matchedUserId: targetId, dailySwipesRemaining };
    }
    throw err;
  }

  return { swipeRecorded: true, isMatch: true, matchedUserId: targetId, dailySwipesRemaining };
};
