export const DIVISIONS = [
  "SXコンサル&イノベーション本部",
  "気候テック事業本部",
  "コーポレート本部",
  "システム本部",
  "その他",
] as const;

export type Division = (typeof DIVISIONS)[number];
