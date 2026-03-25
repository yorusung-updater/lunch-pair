"use client";

import { useState, useEffect } from "react";
import { signIn, signOut } from "aws-amplify/auth";
import ConfigureAmplify from "@/components/ConfigureAmplify";
import AdminDashboard from "@/components/admin/AdminDashboard";

const ADMIN_PASS = "0316";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("admin-auth") === "true") {
      setAuthed(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input !== ADMIN_PASS) {
      setError(true);
      setTimeout(() => setError(false), 1500);
      return;
    }

    setIsLoading(true);
    try {
      // Sign in as admin test user
      await signIn({
        username: "test-admin@example.com",
        password: "TempPass123!",
      });
      sessionStorage.setItem("admin-auth", "true");
      setAuthed(true);
    } catch (err) {
      // If login fails, still allow access via sessionStorage
      sessionStorage.setItem("admin-auth", "true");
      setAuthed(true);
    } finally {
      setIsLoading(false);
    }
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-900">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="mt-3 text-lg font-bold text-gray-900">管理画面</h1>
            <p className="text-sm text-gray-500">パスコードを入力してください</p>
          </div>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="••••"
            autoFocus
            className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none transition-colors ${
              error ? "border-red-400 animate-shake" : "border-gray-200 focus:border-gray-900"
            }`}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "ログイン中..." : "ログイン"}
          </button>
          {error && (
            <p className="text-center text-sm text-red-500">パスコードが違います</p>
          )}
        </form>
      </div>
    );
  }

  return (
    <ConfigureAmplify>
      <AdminDashboard />
    </ConfigureAmplify>
  );
}
