import type { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const CHATREADSTATUS_TABLE = process.env.CHATREADSTATUS_TABLE!;

type Args = { chatId: string };
type Result = { success: boolean };

export const handler: AppSyncResolverHandler<Args, Result> = async (event) => {
  const userId =
    event.identity && "sub" in event.identity ? event.identity.sub : "";
  if (!userId) throw new Error("Unauthorized");

  const { chatId } = event.arguments;
  if (!chatId) throw new Error("chatId is required");

  await ddb.send(
    new PutCommand({
      TableName: CHATREADSTATUS_TABLE,
      Item: {
        chatId,
        userId,
        lastReadAt: new Date().toISOString(),
      },
    })
  );

  return { success: true };
};
