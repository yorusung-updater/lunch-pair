"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import AppShell from "./AppShell";

export default function AuthGate() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <AppShell signOut={signOut!} user={user!} />
      )}
    </Authenticator>
  );
}
