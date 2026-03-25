import type { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  BatchGetCommand,
} from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const MATCH_TABLE = process.env.MATCH_TABLE!;
const CHATMESSAGE_TABLE = process.env.CHATMESSAGE_TABLE!;
const CHATREADSTATUS_TABLE = process.env.CHATREADSTATUS_TABLE!;

type Result = { counts: string; total: number };

export const handler: AppSyncResolverHandler<Record<string, never>, Result> = async (event) => {
  const userId =
    event.identity && "sub" in event.identity ? event.identity.sub : "";
  if (!userId) throw new Error("Unauthorized");

  // 1. Get all matches for this user
  const [r1, r2] = await Promise.all([
    ddb.send(
      new QueryCommand({
        TableName: MATCH_TABLE,
        IndexName: "matchesByUser1Id",
        KeyConditionExpression: "user1Id = :uid",
        ExpressionAttributeValues: { ":uid": userId },
      })
    ),
    ddb.send(
      new QueryCommand({
        TableName: MATCH_TABLE,
        IndexName: "matchesByUser2Id",
        KeyConditionExpression: "user2Id = :uid",
        ExpressionAttributeValues: { ":uid": userId },
      })
    ),
  ]);

  const matches = [...(r1.Items ?? []), ...(r2.Items ?? [])];
  if (matches.length === 0) {
    return { counts: JSON.stringify({}), total: 0 };
  }

  // 2. Compute chatIds
  const chatIds = matches.map((m) => {
    const [id1, id2] = [m.user1Id, m.user2Id].sort();
    return `${id1}_${id2}`;
  });

  // 3. BatchGet read statuses
  const readKeys = chatIds.map((cid) => ({ chatId: cid, userId }));
  const batchResult = await ddb.send(
    new BatchGetCommand({
      RequestItems: {
        [CHATREADSTATUS_TABLE]: { Keys: readKeys },
      },
    })
  );
  const readStatuses = batchResult.Responses?.[CHATREADSTATUS_TABLE] ?? [];
  const lastReadMap = new Map<string, string>();
  for (const rs of readStatuses) {
    lastReadMap.set(rs.chatId, rs.lastReadAt);
  }

  // 4. For each chat, count unread messages
  const countsMap: Record<string, number> = {};
  let total = 0;

  await Promise.all(
    chatIds.map(async (chatId) => {
      const lastRead = lastReadMap.get(chatId);

      const queryParams: any = {
        TableName: CHATMESSAGE_TABLE,
        IndexName: "chatMessagesByChatIdAndSentAt",
        Select: "COUNT",
        KeyConditionExpression: lastRead
          ? "chatId = :cid AND sentAt > :after"
          : "chatId = :cid",
        FilterExpression: "senderId <> :uid",
        ExpressionAttributeValues: {
          ":cid": chatId,
          ":uid": userId,
          ...(lastRead ? { ":after": lastRead } : {}),
        },
      };

      const result = await ddb.send(new QueryCommand(queryParams));
      const count = result.Count ?? 0;
      if (count > 0) {
        countsMap[chatId] = count;
        total += count;
      }
    })
  );

  return { counts: JSON.stringify(countsMap), total };
};
