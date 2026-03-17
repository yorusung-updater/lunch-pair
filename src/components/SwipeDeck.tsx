"use client";

import { useState, useCallback } from "react";
import {
  motion,
} from "motion/react";
import type { ViewableProfile } from "@/types";
import SwipeCard from "./SwipeCard";

export default function SwipeDeck({
  profiles,
  onSwipe,
  onEmpty,
}: {
  profiles: ViewableProfile[];
  onSwipe: (targetId: string, direction: "OK" | "SKIP") => void;
  onEmpty: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [lastAction, setLastAction] = useState<"OK" | "SKIP" | null>(null);

  const handleSwipeComplete = useCallback(
    (direction: "OK" | "SKIP") => {
      setSwiping(false);
      setLastAction(direction);
      onSwipe(profiles[currentIndex].userId, direction);
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setLastAction(null);
      }, 300);
    },
    [currentIndex, onSwipe, profiles]
  );

  if (currentIndex >= profiles.length) {
    onEmpty();
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <span className="text-5xl">✨</span>
        <p className="text-muted-foreground">全員チェックしました！</p>
      </div>
    );
  }

  const profile = profiles[currentIndex];

  return (
    <div className="relative mx-auto flex h-[calc(100dvh-140px)] max-w-lg flex-col items-center px-4">
      {/* Flash overlay for button taps */}
      {lastAction && (
        <motion.div
          className={`pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-2xl ${
            lastAction === "OK" ? "bg-pink-500/30" : "bg-gray-500/30"
          }`}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.span
            className="text-6xl font-black text-white drop-shadow-lg"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {lastAction === "OK" ? "いいかも！" : "また今度"}
          </motion.span>
        </motion.div>
      )}

      <SwipeCard
        key={profile.userId}
        profile={profile}
        onSwipeComplete={handleSwipeComplete}
        onSwipeStart={() => setSwiping(true)}
      />

      {/* Action Buttons */}
      <div className="mt-4 flex w-full max-w-xs justify-center gap-6">
        <button
          onClick={() => handleSwipeComplete("SKIP")}
          disabled={swiping || !!lastAction}
          className="flex flex-col items-center gap-1 disabled:opacity-40 transition-all active:scale-90"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gray-300 bg-white shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">また今度</span>
        </button>
        <button
          onClick={() => handleSwipeComplete("OK")}
          disabled={swiping || !!lastAction}
          className="flex flex-col items-center gap-1 disabled:opacity-40 transition-all active:scale-90"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-500 shadow-md shadow-pink-200">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white" stroke="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <span className="text-[10px] text-pink-500 font-medium">いいかも！</span>
        </button>
      </div>
    </div>
  );
}
