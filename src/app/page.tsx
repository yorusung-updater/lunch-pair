"use client";

import ConfigureAmplify from "@/components/ConfigureAmplify";
import AuthGate from "@/components/AuthGate";

export default function Home() {
  return (
    <ConfigureAmplify>
      <AuthGate />
    </ConfigureAmplify>
  );
}
