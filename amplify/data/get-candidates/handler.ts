import type { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});
const USERPROFILE_TABLE = process.env.USERPROFILE_TABLE!;
const SWIPE_TABLE = process.env.SWIPE_TABLE!;
const STORAGE_BUCKET = process.env.STORAGE_BUCKET!;

type Args = {
  department?: string;
  limit?: number;
  nextToken?: string;
};

type Result = {
  profiles: string;
  nextToken: string | null;
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

  // 1. Get all user IDs I've already swiped on
  const swipedIds = new Set<string>();
  let lastKey: Record<string, any> | undefined;
  do {
    const swipes = await ddb.send(
      new QueryCommand({
        TableName: SWIPE_TABLE,
        IndexName: "swipesBySwiperIdAndTargetId",
        KeyConditionExpression: "swiperId = :sid",
        ExpressionAttributeValues: { ":sid": userId },
        ExclusiveStartKey: lastKey,
      })
    );
    for (const s of swipes.Items ?? []) {
      swipedIds.add(s.targetId);
    }
    lastKey = swipes.LastEvaluatedKey;
  } while (lastKey);

  swipedIds.add(userId); // Exclude self

  // 2. Scan all profiles
  const profiles = await ddb.send(
    new ScanCommand({
      TableName: USERPROFILE_TABLE,
      Limit: limit + swipedIds.size + 10,
    })
  );

  // 3. Filter out already swiped
  const candidates = (profiles.Items ?? []).filter(
    (p) => !swipedIds.has(p.userId)
  );

  // 4. Build ViewableProfiles (progressive reveal: only photo2, NO name or face)
  const viewable = await Promise.all(
    candidates.slice(0, limit).map(async (p) => ({
      userId: p.userId,
      displayName: null,
      photo1Url: null,
      photo2Url: await presign(p.photo2Key),
      photo3Url: await presign(p.photo3Key),
      photo4Url: await presign(p.photo4Key),
      preferences: p.preferences ?? [],
      preferenceFreeText: p.preferenceFreeText ?? null,
      department: p.department ?? null,
      isMatched: false,
    }))
  );

  return {
    profiles: JSON.stringify(viewable),
    nextToken: null,
  };
};
