"use client";

type Tab = "swipe" | "matches" | "likes" | "profile";

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* Stacked cards with person silhouette */}
      <rect x="6" y="2" width="14" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.6"
        fill={active ? "currentColor" : "none"} opacity={active ? 0.15 : 1} />
      <rect x="3" y="5" width="14" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.6"
        fill={active ? "currentColor" : "white"} opacity={active ? 0.3 : 1} />
      <circle cx="10" cy="11.5" r="2.5" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"} opacity={active ? 0.5 : 1} />
      <path d="M6 19.5c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        fill="none" />
    </svg>
  );
}

function TalkIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* Double speech bubbles */}
      <path d="M18 8h-1V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v7a1 1 0 0 0 1 1h1v2l3-2h3"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        fill={active ? "currentColor" : "none"} opacity={active ? 0.2 : 1} />
      <path d="M10 10h8a3 3 0 0 1 3 3v5a1 1 0 0 1-1 1h-1v2l-3-2h-6a3 3 0 0 1-3-3v-3a3 3 0 0 1 3-3z"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        fill={active ? "currentColor" : "none"} opacity={active ? 0.35 : 1} />
      {/* Dots inside */}
      <circle cx="13" cy="15" r="0.8" fill="currentColor" />
      <circle cx="16" cy="15" r="0.8" fill="currentColor" />
      <circle cx="19" cy="15" r="0.8" fill="currentColor" />
    </svg>
  );
}

function LikeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* Heart with sparkle */}
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        fill={active ? "currentColor" : "none"} />
      {/* Sparkle */}
      <path d="M17 2v2M19 3h-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity={active ? 1 : 0.5} />
    </svg>
  );
}

function MyPageIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* Person with gear */}
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6"
        fill={active ? "currentColor" : "none"} opacity={active ? 0.3 : 1} />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
        fill={active ? "currentColor" : "none"} opacity={active ? 0.2 : 1} />
      {/* Small settings cog */}
      <circle cx="19" cy="5" r="1.8" stroke="currentColor" strokeWidth="1.2" fill={active ? "currentColor" : "none"} opacity={active ? 0.4 : 0.6} />
      <path d="M19 2.5v0.5M19 7v0.5M16.8 4.8l0.4 0.4M21 5.8l0.4-0.4M16.8 5.2l0.4-0.4M21 4.2l0.4 0.4M17 5h0.5M20.5 5h0.5"
        stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity={active ? 0.7 : 0.4} />
    </svg>
  );
}

const tabs: { id: Tab; label: string; Icon: React.FC<{ active: boolean }> }[] = [
  { id: "swipe", label: "さがす", Icon: SearchIcon },
  { id: "matches", label: "トーク", Icon: TalkIcon },
  { id: "likes", label: "お相手から", Icon: LikeIcon },
  { id: "profile", label: "マイページ", Icon: MyPageIcon },
];

export default function BottomNav({
  activeTab,
  onTabChange,
  unreadCount = 0,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  unreadCount?: number;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-all ${
                isActive
                  ? "text-orange-500 font-semibold"
                  : "text-gray-400"
              }`}
            >
              <div className="relative">
                <tab.Icon active={isActive} />
                {tab.id === "matches" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
