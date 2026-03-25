export const QUERY_KEYS = {
  myProfile: (userId: string) => ["myProfile", userId] as const,
  candidates: (token: string | null) => ["candidates", token] as const,
  matches: (userId: string) => ["matches", userId] as const,
  whoLikedMe: (userId: string) => ["whoLikedMe", userId] as const,
  myLikes: (userId: string) => ["myLikes", userId] as const,
  unreadCounts: (userId: string) => ["unreadCounts", userId] as const,
  chat: (chatId: string) => ["chat", chatId] as const,
  adminUsers: ["admin-users"] as const,
  adminMatches: ["admin-matches"] as const,
  adminSwipes: ["admin-swipes"] as const,
  adminSimulation: ["admin-simulation"] as const,
  adminAnalytics: ["admin-analytics"] as const,
};
