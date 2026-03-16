"use client";

import { useState, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ViewableProfile } from "./pages/SwipePage";

const SWIPE_THRESHOLD = 100;

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
      <SwipeCard
        key={profile.userId}
        profile={profile}
        swiping={swiping}
        onSwipeComplete={(direction) => {
          setSwiping(false);
          onSwipe(profile.userId, direction);
          setCurrentIndex((i) => i + 1);
        }}
        onSwipeStart={() => setSwiping(true)}
      />

      {/* Action Buttons */}
      <div className="mt-4 flex w-full max-w-xs justify-center gap-8">
        <Button
          variant="outline"
          size="lg"
          className="h-16 w-16 rounded-full text-2xl border-2 border-destructive text-destructive hover:bg-destructive/10"
          onClick={() => {
            onSwipe(profile.userId, "SKIP");
            setCurrentIndex((i) => i + 1);
          }}
          disabled={swiping}
        >
          ✕
        </Button>
        <Button
          size="lg"
          className="h-16 w-16 rounded-full text-2xl bg-green-500 hover:bg-green-600"
          onClick={() => {
            onSwipe(profile.userId, "OK");
            setCurrentIndex((i) => i + 1);
          }}
          disabled={swiping}
        >
          ♥
        </Button>
      </div>
    </div>
  );
}

function SwipeCard({
  profile,
  onSwipeComplete,
  onSwipeStart,
  swiping,
}: {
  profile: ViewableProfile;
  onSwipeComplete: (direction: "OK" | "SKIP") => void;
  onSwipeStart: () => void;
  swiping: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const okOpacity = useTransform(x, [0, 100], [0, 1]);
  const skipOpacity = useTransform(x, [-100, 0], [1, 0]);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
      const direction = info.offset.x > 0 ? "OK" : "SKIP";
      onSwipeComplete(direction);
    }
  }

  // Main photo to show (photo2 = non-face, shown before match)
  const mainPhoto = profile.photo2Url;
  // Additional photos (photo3, photo4)
  const extraPhotos = [profile.photo3Url, profile.photo4Url].filter(Boolean);

  return (
    <motion.div
      ref={containerRef}
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

      {/* Gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

      {/* OK / SKIP indicators */}
      <motion.div
        className="absolute left-6 top-6 rounded-lg border-4 border-green-500 px-4 py-2"
        style={{ opacity: okOpacity }}
      >
        <span className="text-3xl font-black text-green-500">OK</span>
      </motion.div>
      <motion.div
        className="absolute right-6 top-6 rounded-lg border-4 border-red-500 px-4 py-2"
        style={{ opacity: skipOpacity }}
      >
        <span className="text-3xl font-black text-red-500">SKIP</span>
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
          <p className="mt-2 text-sm opacity-90">{profile.preferenceFreeText}</p>
        )}
      </div>
    </motion.div>
  );
}
