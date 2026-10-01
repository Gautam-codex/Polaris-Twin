"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send, Sparkles } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useStation } from "@/components/dashboard/station-context";
import { useCopilotContext } from "@/hooks/useCopilotContext";
import type { CopilotLanguage, CopilotResponse, CopilotTurn, StationId } from "@/shared/types";
import { ChatBubble, TypingIndicator, type ChatMessage } from "./chat-message";

const SITE: Record<StationId, Record<CopilotLanguage, string>> = {
  maitri: { en: "Priyadarshini Lake", hi: "प्रियदर्शिनी झील" },
  bharati: { en: "the Larsemann Hills ridge", hi: "लार्समैन हिल्स रिज" },
};

const suggestions = (stationId: StationId): Record<CopilotLanguage, string[]> => ({
  en: [
    `Is it safe to send a team to ${SITE[stationId].en} now?`,
    "How many days of diesel if the ship is 20 days late?",
    "Which generator needs attention?",
    "What spares run out before resupply?",
  ],
  hi: [
    `क्या अभी ${SITE[stationId].hi} पर टीम भेजना सुरक्षित है?`,
    "अगर जहाज़ 20 दिन देर से आए तो डीज़ल कितने दिन चलेगा?",
    "किस जनरेटर पर ध्यान देने की ज़रूरत है?",
    "आपूर्ति से पहले कौन से स्पेयर पार्ट्स खत्म हो जाएंगे?",
  ],
});

/** Floating "Ask Polaris" button with a chat sheet backed by /api/copilot. */
export function AskPolaris() {
  const { station, stationId } = useStation();
  const context = useCopilotContext();
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<CopilotLanguage>("en");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text || busy || !context) return;
    const history: CopilotTurn[] = messages.filter((m) => !m.error).map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { id: nextId.current++, role: "user", text }]);
    setDraft("");
    setBusy(true);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...context, question: text, language, history }),
      });
      const data = (await res.json()) as CopilotResponse;
      const answer = data.answer || data.error || "Polaris couldn't answer that. Please try again.";
      setMessages((prev) => [...prev, { id: nextId.current++, role: "assistant", text: answer, error: !data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, role: "assistant", text: "Polaris is offline right now. Check the connection and try again.", error: true },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void ask(draft);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button size="lg" className="fixed right-5 bottom-5 z-40 h-12 rounded-full px-5 shadow-lg shadow-primary/20" />
        }
      >
        <Sparkles /> Ask Polaris
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader className="border-b border-border p-4 pr-12">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" /> Ask Polaris
            </SheetTitle>
            <div className="inline-flex rounded-lg border border-border p-0.5 text-xs" role="group" aria-label="Language">
              {(["en", "hi"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  aria-pressed={language === l}
                  className={cn("rounded-md px-2 py-0.5", language === l ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
                >
                  {l === "en" ? "EN" : "हिं"}
                </button>
              ))}
            </div>
          </div>
          <SheetDescription>Operations copilot for {station.name}. Answers use the simulated sensor feed and station SOPs.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">Try a question:</p>
              {suggestions(stationId)[language].map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={!context || busy}
                  onClick={() => void ask(s)}
                  className="rounded-xl border border-border px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}
          {busy && <TypingIndicator />}
          <div ref={bottom} />
        </div>

        <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={language === "hi" ? "Polaris से पूछें…" : "Ask about fuel, weather, generators…"}
            className="h-10"
            maxLength={1000}
          />
          <Button type="submit" size="icon-lg" className="size-10" disabled={!draft.trim() || busy || !context} aria-label="Send">
            <Send />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
