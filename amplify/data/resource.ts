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

export const getMyLikesHandler = defineFunction({
  name: "get-my-likes",
  entry: "./get-my-likes/handler.ts",
  resourceGroupName: "data",
});

export const getUnreadCountsHandler = defineFunction({
  name: "get-unread-counts",
  entry: "./get-unread-counts/handler.ts",
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
      lunchDays: a.string().array(),      // ["月","火","水","木","金"]
      lunchTime: a.string(),              // "12:00" etc.
      lunchBudget: a.string(),            // "~1000円" etc.
      lunchArea: a.string(),              // "本社周辺" etc.
      hasUnlimitedSwipe: a.boolean().default("false"),
      hasLikesReveal: a.boolean().default("false"),
      ethicalTags: a.string().array(),
      ethicalScale: a.string(),
      ethicalMatchingStance: a.string(),
    })
    .identifier(["userId"])
    .secondaryIndexes((index) => [index("department")])
    .authorization((allow) => [
      allow.ownerDefinedIn("userId"),
      allow.authenticated().to(["read", "create", "update", "delete"]),
      allow.apiKey().to(["read"]),
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
      allow.apiKey().to(["read"]),
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
      allow.apiKey().to(["read"]),
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

  Report: a
    .model({
      reporterId: a.id().required(),
      reporterName: a.string(),
      targetId: a.id().required(),
      targetName: a.string(),
      reason: a.string().required(),
      detail: a.string(),
      status: a.enum(["OPEN", "REVIEWED", "ACTIONED"]),
    })
    .secondaryIndexes((index) => [index("status"), index("targetId")])
    .authorization((allow) => [
      allow.authenticated(),
    ]),

  Inquiry: a
    .model({
      userId: a.id().required(),
      displayName: a.string(),
      category: a.string(),
      message: a.string().required(),
      status: a.enum(["OPEN", "CLOSED"]),
    })
    .secondaryIndexes((index) => [index("status")])
    .authorization((allow) => [
      allow.authenticated(),
    ]),

  ChatReadStatus: a
    .model({
      chatId: a.string().required(),
      userId: a.id().required(),
      lastReadAt: a.datetime().required(),
    })
    .identifier(["chatId", "userId"])
    .secondaryIndexes((index) => [index("userId")])
    .authorization((allow) => [
      allow.authenticated(),
    ]),

  // ========== Custom Types ==========

  RecordSwipeResponse: a.customType({
    swipeRecorded: a.boolean(),
    isMatch: a.boolean(),
    matchedUserId: a.string(),
    dailySwipesRemaining: a.integer(),
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
    lunchDays: a.string().array(),
    lunchTime: a.string(),
    lunchBudget: a.string(),
    lunchArea: a.string(),
    ethicalTags: a.string().array(),
    ethicalScale: a.string(),
    ethicalMatchingStance: a.string(),
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

  UnreadCountsResult: a.customType({
    counts: a.string(),
    total: a.integer(),
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
      lunchDay: a.string(),
      lunchTime: a.string(),
      lunchBudget: a.string(),
      lunchArea: a.string(),
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

  getMyLikes: a
    .query()
    .arguments({
      limit: a.integer(),
    })
    .returns(a.ref("WhoLikedMeConnection"))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(getMyLikesHandler)),

  getUnreadCounts: a
    .query()
    .arguments({})
    .returns(a.ref("UnreadCountsResult"))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(getUnreadCountsHandler)),
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
