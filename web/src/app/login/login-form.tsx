"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/useSession";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

const DEMO_EMAIL = "demo@polaristwin.app";
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "";

/** Only allow redirects to dashboard paths on this site. */
function safeNext(value: string | null): string {
  return value && value.startsWith("/dashboard") ? value : "/dashboard";
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) router.replace(next);
  }, [session, next, router]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { error: authError } = await getSupabase().auth.signInWithPassword({ email, password });
      if (authError) setError(authError.message);
      else router.replace(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted-foreground">Email</span>
        <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted-foreground">Password</span>
        <Input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-10"
        />
      </label>
      {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {!isSupabaseConfigured && (
        <p className="text-sm text-warning">Supabase keys are missing in web/.env.local, so sign-in is unavailable.</p>
      )}
      <Button type="submit" size="lg" className="h-10" disabled={submitting || !isSupabaseConfigured}>
        {submitting && <Loader2 className="animate-spin" />}
        Sign in
      </Button>

      <div className="rounded-md border border-border bg-secondary p-4 text-sm">
        <p className="flex items-center gap-2 font-medium text-primary">
          <KeyRound className="size-4" />
          Demo account
        </p>
        <p className="mt-1 text-muted-foreground">
          Email <span className="font-mono text-foreground">{DEMO_EMAIL}</span>
          {DEMO_PASSWORD ? (
            <>
              {" "}· password <span className="font-mono text-foreground">{DEMO_PASSWORD}</span>
            </>
          ) : (
            <> · password on the presentation slide</>
          )}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => {
            setEmail(DEMO_EMAIL);
            if (DEMO_PASSWORD) setPassword(DEMO_PASSWORD);
          }}
        >
          Use demo account
        </Button>
      </div>
    </form>
  );
}
