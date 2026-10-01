"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "cn";
import { useT } from "@/components/language";

/** Standard dashboard card: rounded-lg, subtle border, optional title row. */
export function Panel({
  title,
  icon: Icon,
  action,
  className,
  children,
}: {
  title?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const t = useT();
  return (
    <section className={cn("flex flex-col rounded-lg border border-border bg-card p-5 transition-[border-color,box-shadow] duration-200 hover:border-primary/25 hover:shadow-[0_6px_20px_-12px_rgba(15,31,51,0.25)]", className)}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && (
            <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
              {Icon && <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />}
              {t(title)}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
