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
  const { limit = 20 } = event.arguments;

  if (!userId) throw new Error("Unauthorized");

  // 1. Check premium
  const myProfile = await ddb.send(
    new GetCommand({ TableName: USERPROFILE_TABLE, Key: { userId } })
  );
  if (!myProfile.Item?.hasLikesReveal) {
    return { profiles: JSON.stringify([]), count: 0 };
  }

  // 2. Get swipes targeting me with direction=OK
  const likesResult = await ddb.send(
    new QueryCommand({
      TableName: SWIPE_TABLE,
      IndexName: "swipesByTargetIdAndSwiperId",
      KeyConditionExpression: "targetId = :tid",
      ExpressionAttributeValues: { ":tid": userId },
    })
  );

  const likers = (likesResult.Items ?? []).filter(
    (s) => s.direction === "OK"
  );

  // 3. Check which ones I have NOT swiped on
  const mySwipes = await ddb.send(
    new QueryCommand({
      TableName: SWIPE_TABLE,
      IndexName: "swipesBySwiperIdAndTargetId",
      KeyConditionExpression: "swiperId = :sid",
      ExpressionAttributeValues: { ":sid": userId },
    })
  );
  const mySwipedTargets = new Set(
    (mySwipes.Items ?? []).map((s) => s.targetId)
  );

  const unseenLikers = likers.filter(
    (l) => !mySwipedTargets.has(l.swiperId)
  );

  // 4. Build ViewableProfiles (no face, no name)
  const profiles = await Promise.all(
    unseenLikers.slice(0, limit).map(async (liker) => {
      const profile = await ddb.send(
        new GetCommand({
          TableName: USERPROFILE_TABLE,
          Key: { userId: liker.swiperId },
        })
      );
      if (!profile.Item) return null;
      const p = profile.Item;

      return {
        userId: p.userId,
        displayName: null,
        photo1Url: null,
        photo2Url: await presign(p.photo2Key),
        photo3Url: null,
        photo4Url: null,
        preferences: p.preferences ?? [],
        preferenceFreeText: p.preferenceFreeText ?? null,
        department: p.department ?? null,
        isMatched: false,
      };
    })
  );

  return {
    profiles: JSON.stringify(profiles.filter(Boolean)),
    count: unseenLikers.length,
  };
};
