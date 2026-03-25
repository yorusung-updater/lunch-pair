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
import { useUnreadCounts } from "@/hooks/use-unread";
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
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

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
      <AppContent userId={user.userId} signOut={signOut} />
    </QueryClientProvider>
  );
}

function AppContent({ userId, signOut }: { userId: string; signOut: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("swipe");
  const { showMatchModal, matchedUserId, setMatchModal } = useUiStore();
  const { data: unread } = useUnreadCounts(userId);

  return (
    <div className="flex h-[100dvh] flex-col">
      <main className="flex-1 overflow-y-auto pb-16">
        {activeTab === "swipe" && <SwipePage userId={userId} />}
        {activeTab === "matches" && <MatchesPage userId={userId} />}
        {activeTab === "likes" && <LikesPage userId={userId} />}
        {activeTab === "profile" && (
          <ProfilePage userId={userId} signOut={signOut} />
        )}
      </main>
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadCount={unread?.total ?? 0}
      />
      {showMatchModal && matchedUserId && (
        <MatchModal
          matchedUserId={matchedUserId}
          onClose={() => setMatchModal(false)}
        />
      )}
    </div>
  );
}
