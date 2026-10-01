import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-foreground">
      <span aria-hidden className="grid size-6 place-items-center rounded bg-primary text-[11px] font-semibold text-brand">PT</span>
      <span className="text-[15px] font-semibold tracking-tight">Polaris Twin</span>
    </Link>
  );
}
