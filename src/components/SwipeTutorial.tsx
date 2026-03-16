"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "lunch-pair-tutorial-dismissed";

export default function SwipeTutorial({
  onDone,
}: {
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed !== "true") {
      setOpen(true);
    } else {
      onDone();
    }
  }, [onDone]);

  function handleClose() {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    setOpen(false);
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">
            はじめての方へ
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Step 1 */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-xl">
              👉
            </div>
            <div>
              <p className="font-semibold text-sm">右スワイプ → 気になる！</p>
              <p className="text-xs text-muted-foreground">
                気になる相手を右にスワイプ、または👍ボタンを押してください
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl">
              👈
            </div>
            <div>
              <p className="font-semibold text-sm">左スワイプ → また今度</p>
              <p className="text-xs text-muted-foreground">
                今回はパスしたい相手を左にスワイプ、または👋ボタンを押してください
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xl">
              🎉
            </div>
            <div>
              <p className="font-semibold text-sm">お互いOKでマッチ！</p>
              <p className="text-xs text-muted-foreground">
                お互いがOKした時だけマッチが成立。マッチ後に相手の顔写真と名前が公開されます
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl">
              🔒
            </div>
            <div>
              <p className="font-semibold text-sm">マッチ前はプライバシー保護</p>
              <p className="text-xs text-muted-foreground">
                マッチするまで顔写真と名前は非公開。こだわりと雰囲気写真だけで判断してください
              </p>
            </div>
          </div>
        </div>

        {/* Don't show again checkbox */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-xs text-muted-foreground">
            今後表示しない
          </span>
        </label>

        <Button onClick={handleClose} className="w-full">
          はじめる
        </Button>
      </DialogContent>
    </Dialog>
  );
}
