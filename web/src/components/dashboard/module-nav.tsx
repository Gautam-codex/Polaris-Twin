"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { NAV_ITEMS } from "@/lib/nav";
import { useT } from "@/components/language";
import { useStation } from "./station-context";

function isActive(pathname: string, href: string): boolean {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

/** Vertical list of module links, used in the mobile menu sheet. */
export function ModuleNavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { withStation } = useStation();
  const t = useT();
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={withStation(item.href)}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active ? "bg-secondary font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-[18px] shrink-0" strokeWidth={1.75} />
            {t(item.label)}
          </Link>
        );
      })}
    </nav>
  );
}

/** Horizontal module tabs under the top bar (tablet and desktop); the active tab is underlined. */
export function ModuleTabs() {
  const pathname = usePathname();
  const { withStation } = useStation();
  const t = useT();
  return (
    <nav aria-label="Modules" className="hidden overflow-x-auto px-4 md:block md:px-6">
      <ul className="flex min-w-max gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={withStation(item.href)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group/nav relative flex items-center gap-2 px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "font-medium text-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0 transition-transform duration-200 group-hover/nav:scale-110" strokeWidth={1.75} />
                {t(item.label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
