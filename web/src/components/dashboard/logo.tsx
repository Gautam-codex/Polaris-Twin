import Link from "next/link";
import { Snowflake } from "lucide-react";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-foreground">
      <Snowflake className="size-5 text-primary" />
      <span>Polaris Twin</span>
    </Link>
  );
}
