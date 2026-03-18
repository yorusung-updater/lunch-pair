import { client } from "@/lib/api-client";
import { PREFERENCE_OPTIONS } from "@/constants/preferences";
import { LUNCH_DAYS, LUNCH_TIMES, LUNCH_BUDGETS, LUNCH_AREAS } from "@/constants/lunch";
import {
  FAMILY_NAMES, GIVEN_NAMES_MALE, GIVEN_NAMES_FEMALE,
  DEPARTMENTS, FREE_TEXTS,
} from "@/constants/dummy-data";

// --- Helpers ---
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: readonly T[], min: number, max: number): T[] {
  const n = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// --- Simulate Swipe ---
export async function simulateSwipe(
  swiperId: string,
  targetId: string,
  direction: "OK" | "SKIP"
): Promise<{ isMatch: boolean }> {
  await (client.models as any).Swipe.create({ swiperId, targetId, direction });

  if (direction === "OK") {
    const reverse: any = await (client.models as any).Swipe.get({
      swiperId: targetId,
      targetId: swiperId,
    });
    if (reverse?.data?.direction === "OK") {
      const [user1Id, user2Id] = [swiperId, targetId].sort();
      const [u1, u2] = await Promise.all([
        (client.models as any).UserProfile.get({ userId: user1Id }),
        (client.models as any).UserProfile.get({ userId: user2Id }),
      ]);
      try {
        await (client.models as any).Match.create({
          user1Id,
          user2Id,
          user1DisplayName: u1?.data?.displayName ?? "",
          user2DisplayName: u2?.data?.displayName ?? "",
        });
      } catch {
        // Match already exists (conditional write)
      }
      return { isMatch: true };
    }
  }
  return { isMatch: false };
}

// --- Generate Dummy Users ---
export async function generateDummyUsers(
  count: number,
  onProgress?: (current: number, total: number) => void
): Promise<number> {
  let created = 0;
  for (let i = 0; i < count; i++) {
    const isMale = Math.random() > 0.5;
    const name = pick(FAMILY_NAMES) + (isMale ? pick(GIVEN_NAMES_MALE) : pick(GIVEN_NAMES_FEMALE));
    const userId = crypto.randomUUID();

    try {
      await (client.models as any).UserProfile.create({
        userId,
        displayName: name,
        photo1Key: `photos/placeholder/face${i % 20}.jpg`,
        photo2Key: `photos/placeholder/other${i % 20}.jpg`,
        preferences: pickN(PREFERENCE_OPTIONS, 2, 5),
        preferenceFreeText: pick(FREE_TEXTS),
        department: pick(DEPARTMENTS),
        lunchDays: pickN(LUNCH_DAYS, 2, 5),
        lunchTime: pick(LUNCH_TIMES),
        lunchBudget: pick(LUNCH_BUDGETS),
        lunchArea: pick(LUNCH_AREAS),
        hasUnlimitedSwipe: false,
        hasLikesReveal: false,
      });
      created++;
    } catch {
      // skip on error
    }
    onProgress?.(i + 1, count);
  }
  return created;
}

// --- Generate Random Swipes ---
export async function generateRandomSwipes(
  userIds: string[],
  count: number,
  okRatio: number,
  onProgress?: (current: number, total: number, matches: number) => void
): Promise<{ swipes: number; matches: number }> {
  // Fetch existing swipes to avoid duplicates
  const existingPairs = new Set<string>();
  let nextToken: string | null = null;
  do {
    const res: any = await (client.models as any).Swipe.list({
      limit: 1000,
      nextToken,
    });
    for (const s of res?.data ?? []) {
      existingPairs.add(`${s.swiperId}_${s.targetId}`);
    }
    nextToken = res?.nextToken ?? null;
  } while (nextToken);

  let swipes = 0;
  let matches = 0;

  for (let i = 0; i < count; i++) {
    const a = pick(userIds);
    let b = pick(userIds);
    let attempts = 0;
    while ((b === a || existingPairs.has(`${a}_${b}`)) && attempts < 20) {
      b = pick(userIds);
      attempts++;
    }
    if (b === a || existingPairs.has(`${a}_${b}`)) continue;

    const direction = Math.random() < okRatio ? "OK" : "SKIP";
    const result = await simulateSwipe(a, b, direction as "OK" | "SKIP");
    existingPairs.add(`${a}_${b}`);
    swipes++;
    if (result.isMatch) matches++;
    onProgress?.(i + 1, count, matches);
  }

  return { swipes, matches };
}

// --- Delete All Records ---
async function deleteAllFromModel(
  model: any,
  getKeys: (item: any) => Record<string, string>,
  onProgress?: (deleted: number) => void
) {
  let deleted = 0;
  let nextToken: string | null = null;
  const allItems: any[] = [];

  do {
    const res: any = await model.list({ limit: 1000, nextToken });
    allItems.push(...(res?.data ?? []));
    nextToken = res?.nextToken ?? null;
  } while (nextToken);

  const batch = 5;
  for (let i = 0; i < allItems.length; i += batch) {
    await Promise.all(
      allItems.slice(i, i + batch).map(async (item: any) => {
        try {
          await model.delete(getKeys(item));
        } catch { /* ignore */ }
      })
    );
    deleted = Math.min(i + batch, allItems.length);
    onProgress?.(deleted);
  }
  return deleted;
}

export async function resetAllSwipes(onProgress?: (deleted: number) => void) {
  return deleteAllFromModel(
    (client.models as any).Swipe,
    (item: any) => ({ swiperId: item.swiperId, targetId: item.targetId }),
    onProgress
  );
}

export async function resetAllMatches(onProgress?: (deleted: number) => void) {
  return deleteAllFromModel(
    (client.models as any).Match,
    (item: any) => ({ user1Id: item.user1Id, user2Id: item.user2Id }),
    onProgress
  );
}

export async function resetAllMessages(onProgress?: (deleted: number) => void) {
  return deleteAllFromModel(
    (client.models as any).ChatMessage,
    (item: any) => ({ id: item.id }),
    onProgress
  );
}

export async function resetAll(
  onProgress?: (phase: string, deleted: number) => void
) {
  await resetAllMessages((n) => onProgress?.("メッセージ", n));
  await resetAllMatches((n) => onProgress?.("マッチ", n));
  await resetAllSwipes((n) => onProgress?.("スワイプ", n));
}

// --- Get Candidates For User (client-side replication) ---
export function getCandidatesForUser(
  userId: string,
  allUsers: any[],
  allSwipes: any[]
): { user: any; matchCount: number }[] {
  const myProfile = allUsers.find((u) => u.userId === userId);
  const myPrefs: string[] = myProfile?.preferences ?? [];
  const myPrefSet = new Set(myPrefs);

  const swipedIds = new Set<string>();
  for (const s of allSwipes) {
    if (s.swiperId === userId) swipedIds.add(s.targetId);
  }
  swipedIds.add(userId);

  return allUsers
    .filter((u) => !swipedIds.has(u.userId))
    .map((u) => {
      const prefs: string[] = u.preferences ?? [];
      const matchCount = prefs.filter((p) => myPrefSet.has(p)).length;
      return { user: u, matchCount };
    })
    .sort((a, b) => b.matchCount - a.matchCount);
}

// --- Get Pending (one-sided) OKs ---
export function getPendingOks(
  allSwipes: any[],
  allMatches: any[]
): { swiperId: string; targetId: string }[] {
  const matchedPairs = new Set<string>();
  for (const m of allMatches) {
    matchedPairs.add(`${m.user1Id}_${m.user2Id}`);
  }

  return allSwipes
    .filter((s) => {
      if (s.direction !== "OK") return false;
      const [u1, u2] = [s.swiperId, s.targetId].sort();
      return !matchedPairs.has(`${u1}_${u2}`);
    })
    .map((s) => ({ swiperId: s.swiperId, targetId: s.targetId }));
}
