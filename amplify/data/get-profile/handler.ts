import type { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});
const USERPROFILE_TABLE = process.env.USERPROFILE_TABLE!;
const MATCH_TABLE = process.env.MATCH_TABLE!;
const STORAGE_BUCKET = process.env.STORAGE_BUCKET!;

type Args = { targetUserId: string };

type ViewableProfile = {
  userId: string;
  displayName: string | null;
  photo1Url: string | null;
  photo2Url: string | null;
  photo3Url: string | null;
  photo4Url: string | null;
  preferences: string[];
  preferenceFreeText: string | null;
  department: string | null;
  isMatched: boolean;
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

export const handler: AppSyncResolverHandler<Args, ViewableProfile> = async (
  event
) => {
  const callerId =
    event.identity && "sub" in event.identity ? event.identity.sub : "";
  const { targetUserId } = event.arguments;

  if (!callerId) throw new Error("Unauthorized");

  // Check match status
  const [id1, id2] = [callerId, targetUserId].sort();
  const matchResult = await ddb.send(
    new GetCommand({
      TableName: MATCH_TABLE,
      Key: { user1Id: id1, user2Id: id2 },
    })
  );
  const isMatched = !!matchResult.Item;

  // Fetch target profile
  const profileResult = await ddb.send(
    new GetCommand({
      TableName: USERPROFILE_TABLE,
      Key: { userId: targetUserId },
    })
  );

  if (!profileResult.Item) throw new Error("Profile not found");
  const p = profileResult.Item;

  return {
    userId: p.userId,
    displayName: isMatched ? p.displayName : null,
    photo1Url: isMatched ? await presign(p.photo1Key) : null,
    photo2Url: await presign(p.photo2Key),
    photo3Url: await presign(p.photo3Key),
    photo4Url: await presign(p.photo4Key),
    preferences: p.preferences ?? [],
    preferenceFreeText: p.preferenceFreeText ?? null,
    department: p.department ?? null,
    isMatched,
  };
};
