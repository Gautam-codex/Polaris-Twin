import Link from "next/link";
import { LogoMark } from "./logo-mark";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-foreground">
      <LogoMark size={26} />
      <span className="text-[15px] font-semibold tracking-tight">Polaris Twin</span>
    </Link>
  );
}
