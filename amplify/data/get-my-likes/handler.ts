import type { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});
const USERPROFILE_TABLE = process.env.USERPROFILE_TABLE!;
const SWIPE_TABLE = process.env.SWIPE_TABLE!;
const MATCH_TABLE = process.env.MATCH_TABLE!;
const STORAGE_BUCKET = process.env.STORAGE_BUCKET!;

type Args = { limit?: number };

type Result = {
  profiles: string;
  count: number;
};

async function presign(key: string | undefined | null): Promise<string | null> {
  if (!key) return null;
  try {
    return await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: STORAGE_BUCKET, Key: key }),
      { expiresIn: 3600 }
    );
  } catch {
    return null;
  }
}

export const handler: AppSyncResolverHandler<Args, Result> = async (event) => {
  const userId =
    event.identity && "sub" in event.identity ? event.identity.sub : "";
  const { limit = 50 } = event.arguments;

  if (!userId) throw new Error("Unauthorized");

  // 1. Get all my OK swipes
  const swipesResult = await ddb.send(
    new QueryCommand({
      TableName: SWIPE_TABLE,
      IndexName: "swipesBySwiperIdAndTargetId",
      KeyConditionExpression: "swiperId = :sid",
      ExpressionAttributeValues: { ":sid": userId },
    })
  );

  const okSwipes = (swipesResult.Items ?? []).filter(
    (s) => s.direction === "OK"
  );

  // 2. For each target, get profile and check match status
  const profiles = await Promise.all(
    okSwipes.slice(0, limit).map(async (swipe) => {
      const targetId = swipe.targetId;

      // Get target profile
      const profileResult = await ddb.send(
        new GetCommand({
          TableName: USERPROFILE_TABLE,
          Key: { userId: targetId },
        })
      );
      if (!profileResult.Item) return null;
      const p = profileResult.Item;

      // Check match status
      const [id1, id2] = [userId, targetId].sort();
      const matchResult = await ddb.send(
        new GetCommand({
          TableName: MATCH_TABLE,
          Key: { user1Id: id1, user2Id: id2 },
        })
      );
      const isMatched = !!matchResult.Item;

      return {
        userId: p.userId,
        displayName: isMatched ? p.displayName : null,
        photo1Url: isMatched ? await presign(p.photo1Key) : null,
        photo2Url: await presign(p.photo2Key),
        photo3Url: null,
        photo4Url: null,
        preferences: p.preferences ?? [],
        preferenceFreeText: null,
        department: p.department ?? null,
        lunchDays: null,
        lunchTime: null,
        lunchBudget: null,
        lunchArea: null,
        ethicalTags: null,
        ethicalScale: null,
        ethicalMatchingStance: null,
        isMatched,
      };
    })
  );

  const valid = profiles.filter(Boolean);

  return {
    profiles: JSON.stringify(valid),
    count: valid.length,
  };
};
