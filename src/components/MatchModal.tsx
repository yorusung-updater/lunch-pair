"use client";

import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/types/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ViewableProfile } from "./pages/SwipePage";

const client = generateClient<Schema>();

export default function MatchModal({
  matchedUserId,
  onClose,
}: {
  matchedUserId: string;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<ViewableProfile | null>(null);

  useEffect(() => {
    loadProfile();
  }, [matchedUserId]);

  async function loadProfile() {
    try {
      const result: any = await client.queries.getProfileForViewing({
        targetUserId: matchedUserId,
      });
      if (result?.data) {
        setProfile(result.data as ViewableProfile);
      }
    } catch (err) {
      console.error("Failed to load matched profile:", err);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            🎉 マッチしました！
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* Show face photo now that they're matched! */}
          {profile?.photo1Url ? (
            <img
              src={profile.photo1Url}
              alt="マッチした相手"
              className="h-32 w-32 rounded-full object-cover border-4 border-primary"
            />
          ) : (
            <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center text-4xl">
              💑
            </div>
          )}

          {profile?.displayName && (
            <p className="text-xl font-bold">{profile.displayName}</p>
          )}

          <p className="text-sm text-muted-foreground">
            相手の顔写真と名前が見れるようになりました！
          </p>
        </div>

        <Button onClick={onClose} className="w-full">
          OK
        </Button>
      </DialogContent>
    </Dialog>
  );
}
