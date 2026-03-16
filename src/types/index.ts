export type { Schema } from "./schema";

export type ViewableProfile = {
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

export type MatchEntry = {
  matchedUserId: string;
  displayName: string;
  matchedAt: string | null;
  photoUrl: string | null;
};

export type ChatMessage = {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  messageType: string;
  sentAt: string;
  createdAt: string;
};
