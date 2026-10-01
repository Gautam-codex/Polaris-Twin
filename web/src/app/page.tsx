import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-xl rounded-lg border border-border bg-card p-10 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          Maitri · Bharati
        </p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight text-foreground">
          Polaris Twin
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          A digital twin for India&apos;s Antarctic stations.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className={buttonVariants({ size: "lg", className: "h-10 px-5" })}>
            Open control room
          </Link>
          <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg", className: "h-10 px-5" })}>
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
