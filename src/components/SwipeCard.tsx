"use client";

import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from "motion/react";
import { Badge } from "@/components/ui/badge";
import { FLY_OUT_DISTANCE } from "@/constants/limits";
import type { ViewableProfile } from "@/types";

const SWIPE_THRESHOLD = 100;

export default function SwipeCard({
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
        className="pointer-events-none absolute inset-0 bg-pink-500"
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
        className="absolute left-6 top-6 rounded-xl border-4 border-pink-400 bg-pink-500/20 px-5 py-2 -rotate-12"
        style={{ opacity: okOpacity }}
      >
        <span className="text-3xl font-black text-pink-400 drop-shadow-md">
          いいかも！
        </span>
      </motion.div>
      <motion.div
        className="absolute right-6 top-6 rounded-xl border-4 border-gray-400 bg-gray-800/20 px-5 py-2 rotate-12"
        style={{ opacity: skipOpacity }}
      >
        <span className="text-3xl font-black text-gray-300 drop-shadow-md">
          また今度
        </span>
      </motion.div>

      {/* Profile info */}
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          {profile.department && (
            <span className="text-sm opacity-80">{profile.department}</span>
          )}
          {(profile.matchingPrefsCount ?? 0) > 0 && (
            <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-[11px] font-semibold">
              共通 {profile.matchingPrefsCount}件
            </span>
          )}
        </div>
        {/* Preferences */}
        <div className="flex flex-wrap gap-1.5 mt-1.5">
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
          <p className="mt-1.5 text-sm opacity-90">
            {profile.preferenceFreeText}
          </p>
        )}
      </div>
    </motion.div>
  );
}
