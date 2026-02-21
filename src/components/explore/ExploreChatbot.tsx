"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { SparklesIcon, SearchIcon, MapPinIcon } from "@/lib/weather-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  references?: { slug: string; name: string; type: string }[];
  timestamp: Date;
}

interface ExploreResponse {
  response: string;
  references: { slug: string; name: string; type: string }[];
  error?: boolean;
}

// ---------------------------------------------------------------------------
// Suggested prompts
// ---------------------------------------------------------------------------

/** Cap rendered messages to prevent unbounded memory growth in long conversations. */
const MAX_RENDERED_MESSAGES = 30;

const SUGGESTED_PROMPTS = [
  { label: "Drone flying in Harare", query: "Can I fly a drone in Harare today?" },
  { label: "Farming advice", query: "What's the best time to plant maize in Mashonaland?" },
  { label: "Safari weather", query: "What's the weather like for safari in Victoria Falls?" },
  { label: "Compare cities", query: "Compare weather in Harare and Bulawayo" },
  { label: "Road trip", query: "Is it safe to drive from Harare to Mutare today?" },
  { label: "Weekend plans", query: "What outdoor activities can I do this weekend in Gweru?" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function SendIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
    </svg>
  );
}

export function ExploreChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cancel in-flight fetch on unmount to prevent state updates on unmounted component
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage].slice(-MAX_RENDERED_MESSAGES));
    setInput("");
    setLoading(true);

    try {
      // Build history from previous messages (text only).
      // NOTE: `messages` here is the pre-update snapshot (before userMessage
      // is appended via setMessages above), which is correct — the new user
      // message is sent separately as `message` in the request body.
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Cancel any previous in-flight request before starting a new one
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch("/api/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }

      const data: ExploreResponse = await res.json();

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response,
        references: data.references,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage].slice(-MAX_RENDERED_MESSAGES));
    } catch (err) {
      // Silently ignore aborted requests (user navigated away or sent a new message)
      if (err instanceof DOMException && err.name === "AbortError") return;
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage].slice(-MAX_RENDERED_MESSAGES));
    } finally {
      setLoading(false);
      // Refocus input after response
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [loading, messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (query: string) => {
    sendMessage(query);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0" aria-live="polite" aria-relevant="additions">
        {messages.length === 0 && (
          <EmptyState onSuggestionClick={handleSuggestion} />
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {loading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-border bg-surface-base/50 backdrop-blur-sm px-4 py-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about weather, locations, activities..."
              className="pl-9 pr-4"
              aria-label="Ask Shamwari Explorer"
              disabled={loading}
            />
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={loading || !input.trim()}
            className="min-h-[44px] min-w-[44px] px-3"
            aria-label="Send message"
          >
            <SendIcon size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state with suggested prompts
// ---------------------------------------------------------------------------

function EmptyState({ onSuggestionClick }: { onSuggestionClick: (query: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <SparklesIcon size={24} className="text-primary" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-text-primary font-heading">
        Shamwari Explorer
      </h2>
      <p className="mt-2 max-w-sm text-center text-sm text-text-secondary">
        Ask me anything about weather, locations, and activities. I can help you
        plan your day, compare conditions, and get activity-specific advice.
      </p>

      <div className="mt-6 w-full max-w-md">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">
          Try asking
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt.query}
              onClick={() => onSuggestionClick(prompt.query)}
              className="flex items-center rounded-[var(--radius-card)] border border-border bg-surface-card px-3 py-3 text-left text-sm text-text-secondary transition-colors hover:bg-surface-base hover:text-text-primary hover:border-primary/30 focus-visible:outline-2 focus-visible:outline-primary min-h-[44px]"
              type="button"
            >
              {prompt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-[var(--radius-card)] px-4 py-3 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-surface-card shadow-sm"
        }`}
      >
        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none text-text-secondary prose-strong:text-text-primary prose-headings:text-text-primary prose-li:marker:text-text-tertiary prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {/* Location references as quick links */}
        {!isUser && message.references && message.references.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/50 pt-2.5">
            {message.references
              .filter((ref) => ref.type === "location" || ref.type === "weather")
              .slice(0, 5)
              .map((ref) => (
                <Link
                  key={ref.slug}
                  href={`/${ref.slug}`}
                  className="inline-flex items-center gap-1 rounded-[var(--radius-badge)] bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  <MapPinIcon size={10} className="shrink-0" />
                  {ref.name}
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="flex justify-start" role="status" aria-label="Assistant is typing">
      <div className="flex gap-1.5 rounded-[var(--radius-card)] bg-surface-card px-4 py-3 shadow-sm">
        <span className="h-2 w-2 animate-bounce rounded-full bg-text-tertiary [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-text-tertiary [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-text-tertiary [animation-delay:300ms]" />
      </div>
      {/* Inside role="status" so screen readers announce it */}
      <span className="sr-only">Shamwari Explorer is thinking...</span>
    </div>
  );
}
