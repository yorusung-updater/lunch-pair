"use client";

import { useState, useEffect } from "react";
import type { AuthUser } from "aws-amplify/auth";
import { client } from "@/lib/api-client";
import BottomNav from "./BottomNav";
import SwipePage from "./pages/SwipePage";
import MatchesPage from "./pages/MatchesPage";
import LikesPage from "./pages/LikesPage";
import ProfilePage from "./pages/ProfilePage";
import ProfileSetup from "./pages/ProfileSetup";
import MatchModal from "./MatchModal";
import { useUiStore } from "@/stores/ui-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

type Tab = "swipe" | "matches" | "likes" | "profile";

export default function AppShell({
  signOut,
  user,
}: {
  signOut: () => void;
  user: AuthUser;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("swipe");
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const { showMatchModal, matchedUserId, setMatchModal } = useUiStore();

  useEffect(() => {
    checkProfile();
  }, [user]);

  async function checkProfile() {
    try {
      const result: any = await client.models.UserProfile.get({
        userId: user.userId,
      });
      setHasProfile(!!result?.data);
    } catch {
      setHasProfile(false);
    }
  }

  if (hasProfile === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <QueryClientProvider client={queryClient}>
        <ProfileSetup
          userId={user.userId}
          onComplete={() => setHasProfile(true)}
        />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-[100dvh] flex-col">
        <main className="flex-1 overflow-y-auto pb-16">
          {activeTab === "swipe" && <SwipePage userId={user.userId} />}
          {activeTab === "matches" && <MatchesPage userId={user.userId} />}
          {activeTab === "likes" && <LikesPage userId={user.userId} />}
          {activeTab === "profile" && (
            <ProfilePage userId={user.userId} signOut={signOut} />
          )}
        </main>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        {showMatchModal && matchedUserId && (
          <MatchModal
            matchedUserId={matchedUserId}
            onClose={() => setMatchModal(false)}
          />
        )}
      </div>
    </QueryClientProvider>
  );
}
