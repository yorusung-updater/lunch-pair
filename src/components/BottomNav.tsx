"use client";

type Tab = "swipe" | "matches" | "likes" | "profile";

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "swipe", label: "スワイプ", icon: "👆" },
  { id: "matches", label: "マッチ", icon: "💬" },
  { id: "likes", label: "いいね", icon: "💛" },
  { id: "profile", label: "プロフ", icon: "👤" },
];

export default function BottomNav({
  activeTab,
  onTabChange,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
              activeTab === tab.id
                ? "text-primary font-semibold"
                : "text-muted-foreground"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
