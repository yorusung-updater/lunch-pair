"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const ddb = lib_dynamodb_1.DynamoDBDocumentClient.from(new client_dynamodb_1.DynamoDBClient({}));
const s3 = new client_s3_1.S3Client({});
const USERPROFILE_TABLE = process.env.USERPROFILE_TABLE;
const SWIPE_TABLE = process.env.SWIPE_TABLE;
const STORAGE_BUCKET = process.env.STORAGE_BUCKET;
async function presign(key) {
    if (!key)
        return null;
    try {
        return await (0, s3_request_presigner_1.getSignedUrl)(s3, new client_s3_1.GetObjectCommand({ Bucket: STORAGE_BUCKET, Key: key }), { expiresIn: 3600 });
    }
    catch {
        return null;
    }
}
const handler = async (event) => {
    const userId = event.identity && "sub" in event.identity ? event.identity.sub : "";
    const { department, lunchDay, lunchTime, lunchBudget, lunchArea, limit = 20 } = event.arguments;
    if (!userId)
        throw new Error("Unauthorized");
    // 0. Fetch caller's preferences for affinity sorting
    const callerProfile = await ddb.send(new lib_dynamodb_1.GetCommand({ TableName: USERPROFILE_TABLE, Key: { userId } }));
    const myPrefs = callerProfile.Item?.preferences ?? [];
    // 1. Get all user IDs I've already swiped on
    const swipedIds = new Set();
    let lastKey;
    do {
        const swipes = await ddb.send(new lib_dynamodb_1.QueryCommand({
            TableName: SWIPE_TABLE,
            IndexName: "swipesBySwiperIdAndTargetId",
            KeyConditionExpression: "swiperId = :sid",
            ExpressionAttributeValues: { ":sid": userId },
            ExclusiveStartKey: lastKey,
        }));
        for (const s of swipes.Items ?? []) {
            swipedIds.add(s.targetId);
        }
        lastKey = swipes.LastEvaluatedKey;
    } while (lastKey);
    swipedIds.add(userId);
    // 2. Scan all profiles
    const profiles = await ddb.send(new lib_dynamodb_1.ScanCommand({ TableName: USERPROFILE_TABLE, Limit: 500 }));
    // 3. Filter: already swiped + lunch criteria
    let candidates = (profiles.Items ?? []).filter((p) => !swipedIds.has(p.userId));
    if (department) {
        candidates = candidates.filter((p) => p.department === department);
    }
    if (lunchDay) {
        candidates = candidates.filter((p) => p.lunchDays && Array.isArray(p.lunchDays) && p.lunchDays.includes(lunchDay));
    }
    if (lunchTime) {
        candidates = candidates.filter((p) => p.lunchTime === lunchTime);
    }
    if (lunchBudget) {
        candidates = candidates.filter((p) => p.lunchBudget === lunchBudget);
    }
    if (lunchArea) {
        candidates = candidates.filter((p) => p.lunchArea === lunchArea);
    }
    // 4. Sort by こだわり affinity (most overlapping preferences first)
    if (myPrefs.length > 0) {
        const myPrefSet = new Set(myPrefs);
        candidates.sort((a, b) => {
            const aPrefs = a.preferences ?? [];
            const bPrefs = b.preferences ?? [];
            const aMatch = aPrefs.filter((p) => myPrefSet.has(p)).length;
            const bMatch = bPrefs.filter((p) => myPrefSet.has(p)).length;
            return bMatch - aMatch; // descending
        });
    }
    // 5. Build ViewableProfiles (progressive reveal)
    const viewable = await Promise.all(candidates.slice(0, limit).map(async (p) => {
        const prefs = p.preferences ?? [];
        const matchCount = myPrefs.length > 0
            ? prefs.filter((pr) => myPrefs.includes(pr)).length
            : 0;
        return {
            userId: p.userId,
            displayName: null,
            photo1Url: p.photo1Url || null,
            photo2Url: p.photo2Url || await presign(p.photo2Key),
            photo3Url: p.photo3Url || await presign(p.photo3Key),
            photo4Url: p.photo4Url || await presign(p.photo4Key),
            preferences: prefs,
            preferenceFreeText: p.preferenceFreeText ?? null,
            department: p.department ?? null,
            lunchDays: p.lunchDays ?? [],
            lunchTime: p.lunchTime ?? null,
            lunchBudget: p.lunchBudget ?? null,
            lunchArea: p.lunchArea ?? null,
            ethicalTags: null,
            ethicalScale: null,
            ethicalMatchingStance: null,
            matchingPrefsCount: matchCount,
            isMatched: false,
        };
    }));
    return {
        profiles: JSON.stringify(viewable),
        nextToken: null,
    };
};
exports.handler = handler;
