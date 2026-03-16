"use client";

import { useEffect, useState } from "react";

export default function ConfigureAmplify({
  children,
}: {
  children: React.ReactNode;
}) {
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    import("@/lib/amplify-config").then(() => setConfigured(true));
  }, []);

  if (!configured) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
