"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { QUERY_KEYS } from "@/constants/query-keys";
import { getChatId } from "@/utils/chat";
import { formatTime, formatDateFull } from "@/utils/date";
import type { ChatMessage } from "@/types";
import { SUGGESTIONS } from "@/constants/chat-suggestions";

export default function ChatPage({
  userId,
  matchedUserId,
  matchedUserName,
  onBack,
}: {
  userId: string;
  matchedUserId: string;
  matchedUserName: string;
  onBack: () => void;
}) {
  const chatId = getChatId(userId, matchedUserId);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: messages } = useQuery({
    queryKey: QUERY_KEYS.chat(chatId),
    queryFn: async () => {
      const result: any = await client.models.ChatMessage
        .listChatMessageByChatIdAndSentAt(
          { chatId },
          { sortDirection: "ASC", limit: 100 }
        );
      return (result?.data ?? []) as ChatMessage[];
    },
    refetchInterval: 1000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let sub: any;
    try {
      const model = client.models.ChatMessage as any;
      if (model?.onCreate) {
        sub = model.onCreate().subscribe({
          next: (msg: ChatMessage) => {
            if (msg.chatId === chatId) {
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat(chatId) });
            }
          },
        });
      }
    } catch { /* polling handles it */ }
    return () => sub?.unsubscribe?.();
  }, [chatId, queryClient]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await client.models.ChatMessage.create({
        chatId,
        senderId: userId,
        content: text.trim(),
        messageType: "TEXT",
        sentAt: new Date().toISOString(),
      });
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat(chatId) });
      inputRef.current?.focus();
    } catch (err) {
      console.error("Send failed:", err);
    } finally {
      setSending(false);
    }
  }, [sending, chatId, userId, queryClient]);

  const handleSend = useCallback(() => {
    sendMessage(newMessage);
  }, [newMessage, sendMessage]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-b from-orange-50 to-background">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border-b px-4 py-3 shadow-sm">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div>
            <p className="font-semibold text-sm leading-tight">{matchedUserName}</p>
            <p className="text-[11px] text-orange-500">ランチの予定を決めましょう 🍽️</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
        {!messages || messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 pt-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <span className="text-3xl">🍽️</span>
            </div>
            <div>
              <p className="font-semibold text-base">マッチおめでとう!</p>
              <p className="text-sm text-muted-foreground mt-1">ランチの約束をしてみましょう</p>
            </div>
            <div className="flex flex-col gap-2 mt-3 w-full max-w-xs">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:border-orange-300 active:scale-[0.98] transition-all shadow-sm text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] text-muted-foreground">
                {formatDateFull(messages[0]?.sentAt || messages[0]?.createdAt)}
              </span>
            </div>
            {messages.map((msg) => {
              const isMe = msg.senderId === userId;
              return (
                <div
                  key={msg.id ?? msg.sentAt}
                  className={`flex items-end gap-1.5 ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[68%] rounded-2xl px-3.5 py-2 shadow-sm ${
                      isMe
                        ? "bg-orange-500 text-white rounded-br-md"
                        : "bg-white rounded-bl-md"
                    }`}
                  >
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-[10px] mt-0.5 text-right ${isMe ? "text-white/60" : "text-gray-400"}`}>
                      {formatTime(msg.sentAt || msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white/90 backdrop-blur-sm p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="メッセージを入力..."
            className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-md hover:bg-orange-600 active:scale-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
