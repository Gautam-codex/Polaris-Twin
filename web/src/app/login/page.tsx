import { Suspense } from "react";
import type { Metadata } from "next";
import { Logo } from "@/components/dashboard/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in · Polaris Twin" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 sm:p-8">
        <Logo />
        <h1 className="mt-6 text-xl font-semibold text-foreground">Control room sign-in</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">Monitor Maitri and Bharati from NCPOR Goa.</p>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
