"use client";

import { useState, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ViewableProfile } from "./pages/SwipePage";

const SWIPE_THRESHOLD = 100;
const FLY_OUT_DISTANCE = 600;

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
            lastAction === "OK" ? "bg-green-500/30" : "bg-gray-500/30"
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
            {lastAction === "OK" ? "気になる！" : "また今度"}
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
      <div className="mt-4 flex w-full max-w-xs justify-center gap-8">
        <Button
          variant="outline"
          size="lg"
          className="h-16 w-16 rounded-full text-2xl border-2 border-gray-300 text-gray-400 hover:bg-gray-100 active:scale-90 transition-transform"
          onClick={() => handleSwipeComplete("SKIP")}
          disabled={swiping || !!lastAction}
        >
          👋
        </Button>
        <Button
          size="lg"
          className="h-16 w-16 rounded-full text-2xl bg-green-500 hover:bg-green-600 active:scale-90 transition-transform"
          onClick={() => handleSwipeComplete("OK")}
          disabled={swiping || !!lastAction}
        >
          👍
        </Button>
      </div>
    </div>
  );
}

function SwipeCard({
  profile,
  onSwipeComplete,
  onSwipeStart,
}: {
  profile: ViewableProfile;
  onSwipeComplete: (direction: "OK" | "SKIP") => void;
  onSwipeStart: () => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const okOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const skipOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  // Background tint based on swipe direction
  const bgGreen = useTransform(x, [0, SWIPE_THRESHOLD], [0, 0.25]);
  const bgRed = useTransform(x, [-SWIPE_THRESHOLD, 0], [0.25, 0]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
      const direction = info.offset.x > 0 ? "OK" : "SKIP";
      const target = direction === "OK" ? FLY_OUT_DISTANCE : -FLY_OUT_DISTANCE;
      animate(x, target, { duration: 0.3 });
      setTimeout(() => onSwipeComplete(direction), 200);
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
    }
  }

  const mainPhoto = profile.photo2Url;

  return (
    <motion.div
      className="relative w-full flex-1 cursor-grab overflow-hidden rounded-2xl bg-card shadow-xl active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragStart={onSwipeStart}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.98 }}
    >
      {/* Photo */}
      {mainPhoto ? (
        <img
          src={mainPhoto}
          alt="プロフィール写真"
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <span className="text-6xl">🍽️</span>
        </div>
      )}

      {/* Direction tint overlays */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-green-500"
        style={{ opacity: bgGreen }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gray-500"
        style={{ opacity: bgRed }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

      {/* OK / SKIP stamp indicators */}
      <motion.div
        className="absolute left-6 top-6 rounded-lg border-4 border-green-400 bg-green-500/20 px-5 py-2 -rotate-12"
        style={{ opacity: okOpacity }}
      >
        <span className="text-3xl font-black text-green-400 drop-shadow-md">
          気になる！
        </span>
      </motion.div>
      <motion.div
        className="absolute right-6 top-6 rounded-lg border-4 border-gray-400 bg-gray-500/20 px-4 py-2 rotate-12"
        style={{ opacity: skipOpacity }}
      >
        <span className="text-3xl font-black text-gray-300 drop-shadow-md">
          また今度
        </span>
      </motion.div>

      {/* Profile info */}
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        {profile.department && (
          <p className="text-sm opacity-80 mb-1">{profile.department}</p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {profile.preferences?.map((pref) => (
            <Badge
              key={pref}
              variant="secondary"
              className="bg-white/20 text-white border-0 text-xs"
            >
              {pref}
            </Badge>
          ))}
        </div>
        {profile.preferenceFreeText && (
          <p className="mt-2 text-sm opacity-90">
            {profile.preferenceFreeText}
          </p>
        )}
      </div>
    </motion.div>
  );
}
