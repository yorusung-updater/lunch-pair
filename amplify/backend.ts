import { defineBackend } from "@aws-amplify/backend";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { auth } from "./auth/resource";
import {
  data,
  recordSwipeHandler,
  getCandidatesHandler,
  getProfileHandler,
  getWhoLikedMeHandler,
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
});

// Get DynamoDB table names from the data stack
const tables = {
  UserProfile: backend.data.resources.tables["UserProfile"],
  Swipe: backend.data.resources.tables["Swipe"],
  Match: backend.data.resources.tables["Match"],
};

// Grant all Lambda functions access to DynamoDB tables
const allFunctions = [
  backend.recordSwipeHandler,
  backend.getCandidatesHandler,
  backend.getProfileHandler,
  backend.getWhoLikedMeHandler,
];

for (const fn of allFunctions) {
  // Add table name env vars
  fn.addEnvironment("USERPROFILE_TABLE", tables.UserProfile.tableName);
  fn.addEnvironment("SWIPE_TABLE", tables.Swipe.tableName);
  fn.addEnvironment("MATCH_TABLE", tables.Match.tableName);

  // Grant DynamoDB access
  fn.resources.lambda.addToRolePolicy(
    new PolicyStatement({
      actions: [
        "dynamodb:GetItem",
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
