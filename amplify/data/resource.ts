import {
  type ClientSchema,
  a,
  defineData,
  defineFunction,
} from "@aws-amplify/backend";

// --- Lambda function definitions ---
export const recordSwipeHandler = defineFunction({
  name: "record-swipe",
  entry: "./record-swipe/handler.ts",
  resourceGroupName: "data",
});

export const getCandidatesHandler = defineFunction({
  name: "get-candidates",
  entry: "./get-candidates/handler.ts",
  resourceGroupName: "data",
});

export const getProfileHandler = defineFunction({
  name: "get-profile",
  entry: "./get-profile/handler.ts",
  resourceGroupName: "data",
});

export const getWhoLikedMeHandler = defineFunction({
  name: "get-who-liked-me",
  entry: "./get-who-liked-me/handler.ts",
  resourceGroupName: "data",
});

// --- Schema definition ---
const schema = a.schema({
  // ========== Models ==========

  UserProfile: a
    .model({
      userId: a.id().required(),
      displayName: a.string().required(),
      photo1Key: a.string().required(),
      photo2Key: a.string().required(),
      photo3Key: a.string(),
      photo4Key: a.string(),
      preferences: a.string().array(),
      preferenceFreeText: a.string(),
      department: a.string(),
      isPremium: a.boolean().default("false"),
    })
    .identifier(["userId"])
    .secondaryIndexes((index) => [index("department")])
    .authorization((allow) => [
      allow.ownerDefinedIn("userId"),
      allow.authenticated().to(["read"]),
    ]),

  Swipe: a
    .model({
      swiperId: a.id().required(),
      targetId: a.id().required(),
      direction: a.enum(["OK", "SKIP"]),
    })
    .identifier(["swiperId", "targetId"])
    .secondaryIndexes((index) => [
      index("swiperId").sortKeys(["targetId"]),
      index("targetId").sortKeys(["swiperId"]),
    ])
    .authorization((allow) => [
      allow.authenticated(),
    ]),

  Match: a
    .model({
      user1Id: a.id().required(),
      user2Id: a.id().required(),
      user1DisplayName: a.string(),
      user2DisplayName: a.string(),
    })
    .identifier(["user1Id", "user2Id"])
    .secondaryIndexes((index) => [
      index("user1Id"),
      index("user2Id"),
    ])
    .authorization((allow) => [
      allow.authenticated(),
    ]),

  ChatMessage: a
    .model({
      chatId: a.string().required(), // sorted "{user1Id}_{user2Id}"
      senderId: a.id().required(),
      content: a.string().required(),
      messageType: a.enum(["TEXT", "PLAN"]),
      sentAt: a.datetime().required(),
    })
    .secondaryIndexes((index) => [
      index("chatId").sortKeys(["sentAt"]),
    ])
    .authorization((allow) => [
      allow.authenticated(),
    ]),

  // ========== Custom Types ==========

  RecordSwipeResponse: a.customType({
    swipeRecorded: a.boolean(),
    isMatch: a.boolean(),
    matchedUserId: a.string(),
  }),

  ViewableProfile: a.customType({
    userId: a.string(),
    displayName: a.string(),
    photo1Url: a.string(),
    photo2Url: a.string(),
    photo3Url: a.string(),
    photo4Url: a.string(),
    preferences: a.string().array(),
    preferenceFreeText: a.string(),
    department: a.string(),
    isMatched: a.boolean(),
  }),

  CandidateConnection: a.customType({
    profiles: a.string(),
    nextToken: a.string(),
  }),

  WhoLikedMeConnection: a.customType({
    profiles: a.string(),
    count: a.integer(),
  }),

  // ========== Custom Operations ==========

  recordSwipe: a
    .mutation()
    .arguments({
      targetId: a.id().required(),
      direction: a.enum(["OK", "SKIP"]),
    })
    .returns(a.ref("RecordSwipeResponse"))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(recordSwipeHandler)),

  getSwipeCandidates: a
    .query()
    .arguments({
      department: a.string(),
      limit: a.integer(),
      nextToken: a.string(),
    })
    .returns(a.ref("CandidateConnection"))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(getCandidatesHandler)),

  getProfileForViewing: a
    .query()
    .arguments({
      targetUserId: a.id().required(),
    })
    .returns(a.ref("ViewableProfile"))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(getProfileHandler)),

  getWhoLikedMe: a
    .query()
    .arguments({
      limit: a.integer(),
    })
    .returns(a.ref("WhoLikedMeConnection"))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(getWhoLikedMeHandler)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
