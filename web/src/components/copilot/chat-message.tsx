import ReactMarkdown from "react-markdown";
import { cn } from "cn";

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  error?: boolean;
}

/** One chat bubble; assistant answers render as markdown. */
export function ChatBubble({ message }: { message: ChatMessage }) {
  const user = message.role === "user";
  return (
    <div className={cn("flex", user ? "justify-end" : "justify-start")}>
      <div
        // Chat text is the user's own words or the AI's answer, already in the chosen language.
        translate={message.error ? undefined : "no"}
        className={cn(
          "max-w-[88%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
          user && "bg-primary text-primary-foreground",
          !user && !message.error && "assistant-bubble border border-border bg-secondary/60 text-foreground",
          message.error && "assistant-bubble border border-destructive/30 bg-destructive/8 text-destructive",
        )}
      >
        {user ? (
          message.text
        ) : (
          <div className="flex flex-col gap-2 [&_li]:ml-4 [&_ol]:list-decimal [&_strong]:font-semibold [&_ul]:list-disc">
            <ReactMarkdown>{message.text}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start" aria-label="Polaris is typing">
      <div className="flex gap-1 rounded-lg border border-border bg-secondary/60 px-4 py-3">
        {[0, 150, 300].map((delay) => (
          <span key={delay} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
    </div>
  );
}
