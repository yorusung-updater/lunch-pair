import { defineBackend } from "@aws-amplify/backend";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { auth } from "./auth/resource";
import {
  data,
  recordSwipeHandler,
  getCandidatesHandler,
  getProfileHandler,
  getWhoLikedMeHandler,
  getMyLikesHandler,
  getUnreadCountsHandler,
} from "./data/resource";
import { storage } from "./storage/resource";

const backend = defineBackend({
  auth,
  data,
  storage,
  recordSwipeHandler,
  getCandidatesHandler,
  getProfileHandler,
  getWhoLikedMeHandler,
  getMyLikesHandler,
  getUnreadCountsHandler,
});

// Get DynamoDB table names from the data stack
const tables = {
  UserProfile: backend.data.resources.tables["UserProfile"],
  Swipe: backend.data.resources.tables["Swipe"],
  Match: backend.data.resources.tables["Match"],
  ChatMessage: backend.data.resources.tables["ChatMessage"],
  ChatReadStatus: backend.data.resources.tables["ChatReadStatus"],
};

// Grant all Lambda functions access to DynamoDB tables
const allFunctions = [
  backend.recordSwipeHandler,
  backend.getCandidatesHandler,
  backend.getProfileHandler,
  backend.getWhoLikedMeHandler,
  backend.getMyLikesHandler,
  backend.getUnreadCountsHandler,
];

for (const fn of allFunctions) {
  // Add table name env vars
  fn.addEnvironment("USERPROFILE_TABLE", tables.UserProfile.tableName);
  fn.addEnvironment("SWIPE_TABLE", tables.Swipe.tableName);
  fn.addEnvironment("MATCH_TABLE", tables.Match.tableName);
  fn.addEnvironment("CHATMESSAGE_TABLE", tables.ChatMessage.tableName);
  fn.addEnvironment("CHATREADSTATUS_TABLE", tables.ChatReadStatus.tableName);

  // Grant DynamoDB access
  fn.resources.lambda.addToRolePolicy(
    new PolicyStatement({
      actions: [
        "dynamodb:GetItem",
        "dynamodb:BatchGetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
      ],
      resources: [
        tables.UserProfile.tableArn,
        `${tables.UserProfile.tableArn}/index/*`,
        tables.Swipe.tableArn,
        `${tables.Swipe.tableArn}/index/*`,
        tables.Match.tableArn,
        `${tables.Match.tableArn}/index/*`,
        tables.ChatMessage.tableArn,
        `${tables.ChatMessage.tableArn}/index/*`,
        tables.ChatReadStatus.tableArn,
        `${tables.ChatReadStatus.tableArn}/index/*`,
      ],
    })
  );
}

// Grant S3 access for presigned URL generation
const storageBucket = backend.storage.resources.bucket;
for (const fn of [
  backend.getCandidatesHandler,
  backend.getProfileHandler,
  backend.getWhoLikedMeHandler,
  backend.getMyLikesHandler,
]) {
  fn.addEnvironment("STORAGE_BUCKET", storageBucket.bucketName);
  fn.addEnvironment("STORAGE_REGION", backend.storage.resources.bucket.stack.region);

  fn.resources.lambda.addToRolePolicy(
    new PolicyStatement({
      actions: ["s3:GetObject"],
      resources: [`${storageBucket.bucketArn}/*`],
    })
  );
}
