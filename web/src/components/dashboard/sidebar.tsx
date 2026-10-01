"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "cn";
import { NAV_ITEMS } from "@/lib/nav";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useStation } from "./station-context";

function isActive(pathname: string, href: string): boolean {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

/** Navigation links; used in the desktop sidebar and the mobile sheet. */
export function SidebarNav({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { withStation } = useStation();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const link = (
          <Link
            key={item.href}
            href={withStation(item.href)}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <item.icon className="size-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
            {collapsed && <span className="sr-only">{item.label}</span>}
          </Link>
        );
        if (!collapsed) return link;
        return (
          <Tooltip key={item.href}>
            <TooltipTrigger render={link} />
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

/** Desktop sidebar (md and up) that collapses to icons. */
export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card/60 p-3 transition-[width] md:flex",
        collapsed ? "w-[72px]" : "w-60",
      )}
    >
      <div className={cn("mb-6 flex items-center px-2 pt-2", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Modules</span>}
        <button
          type="button"
          onClick={onToggle}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
        </button>
      </div>
      <SidebarNav collapsed={collapsed} />
      {!collapsed && (
        <p className="mt-auto px-3 pb-2 text-xs leading-relaxed text-muted-foreground">
          Edge-first twin: each station keeps running offline and syncs alerts to NCPOR Goa.
        </p>
      )}
    </aside>
  );
}
