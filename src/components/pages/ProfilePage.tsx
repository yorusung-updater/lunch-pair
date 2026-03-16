"use client";

import { useState } from "react";
import { useMyProfile, usePhotoUpdate } from "@/hooks/use-profile";
import ProfileView from "@/components/profile/ProfileView";
import ProfileEdit from "@/components/profile/ProfileEdit";

export default function ProfilePage({
  userId,
  signOut,
}: {
  userId: string;
  signOut: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const { data: profile, isLoading } = useMyProfile(userId);
  const handlePhotoUpdate = usePhotoUpdate(userId);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
      </div>
    );
  }

  if (!profile) return null;

  if (editing) {
    return (
      <ProfileEdit
        userId={userId}
        profile={profile}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    );
  }

  return (
    <ProfileView
      profile={profile}
      onEdit={() => setEditing(true)}
      onPhotoUpdate={handlePhotoUpdate}
      signOut={signOut}
    />
  );
}
