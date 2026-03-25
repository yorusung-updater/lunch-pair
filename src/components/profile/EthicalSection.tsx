"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ETHICAL_CATEGORIES,
  ETHICAL_SCALE_OPTIONS,
  ETHICAL_MATCHING_STANCE_OPTIONS,
} from "@/constants/ethical";

export default function EthicalSection({
  selectedTags,
  onTagsChange,
  scale,
  onScaleChange,
  matchingStance,
  onMatchingStanceChange,
}: {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  scale: string;
  onScaleChange: (scale: string) => void;
  matchingStance: string;
  onMatchingStanceChange: (stance: string) => void;
}) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  function toggleTag(tag: string) {
    onTagsChange(
      selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag]
    );
  }

  function toggleCategory(id: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function getCategoryCount(items: string[]) {
    return items.filter((item) => selectedTags.includes(item)).length;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">🌱 エシカルプロフィール</CardTitle>
        <p className="text-xs text-muted-foreground">
          マッチング後に相手に公開されます（任意）
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ethical Scale */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">エシカル度</p>
          <div className="grid grid-cols-1 gap-1.5">
            {ETHICAL_SCALE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onScaleChange(scale === option ? "" : option)}
                className={`rounded-lg px-3 py-2 text-left text-sm transition-all ${
                  scale === option
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">関心のある分野</p>
          <div className="space-y-1.5">
            {ETHICAL_CATEGORIES.map((cat) => {
              const count = getCategoryCount(cat.items);
              const isExpanded = expandedCategories.has(cat.id);

              return (
                <div key={cat.id} className="rounded-xl border border-gray-100 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm">
                      {cat.icon} {cat.label}
                    </span>
                    <span className="flex items-center gap-2">
                      {count > 0 && (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-100 px-1.5 text-xs font-medium text-emerald-700">
                          {count}
                        </span>
                      )}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                      {cat.items.map((item) => (
                        <Badge
                          key={item}
                          variant={selectedTags.includes(item) ? "default" : "outline"}
                          className={`cursor-pointer select-none text-xs py-1 px-2.5 ${
                            selectedTags.includes(item)
                              ? "bg-emerald-500 hover:bg-emerald-600 border-emerald-500"
                              : ""
                          }`}
                          onClick={() => toggleTag(item)}
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Matching Stance */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">相手への姿勢</p>
          <p className="text-xs text-muted-foreground mb-2">
            価値観の違いにどう向き合いたいですか？
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {ETHICAL_MATCHING_STANCE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  onMatchingStanceChange(matchingStance === option ? "" : option)
                }
                className={`rounded-lg px-3 py-2 text-left text-sm transition-all ${
                  matchingStance === option
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {selectedTags.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {selectedTags.length}件選択中
          </p>
        )}
      </CardContent>
    </Card>
  );
}
