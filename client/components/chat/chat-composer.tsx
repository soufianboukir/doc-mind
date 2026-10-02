"use client";

import { useRef, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  disabled,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit();
      }
    }
  };

  return (
    <div className="border-t border-white/[0.06] bg-[#111113] px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-white/[0.08] bg-[#1F1F23] px-3 py-2 shadow-[0_2px_16px_rgba(0,0,0,0.3)] focus-within:border-[#7C93FF]/50">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask something about your documents…"
          rows={1}
          disabled={disabled}
          className="max-h-40 min-h-[36px] resize-none border-0 bg-transparent p-1.5 text-[14px] text-[#EDEDEC] placeholder:text-[#5C5C63] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          size="icon"
          className="mb-0.5 h-8 w-8 shrink-0 rounded-full bg-[#7C93FF] text-[#0F0F11] hover:bg-[#8FA3FF] disabled:bg-[#2A2A2E] disabled:text-[#5C5C63]"
          aria-label="Send message"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-[#5C5C63]">
        Answers are grounded in your uploaded documents — press Enter to send,
        Shift+Enter for a new line.
      </p>
    </div>
  );
}
