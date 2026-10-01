"use client";

import type { ReactNode } from "react";
import { useT } from "@/components/language";

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  const t = useT();
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-foreground">{t(title)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {actions}
    </div>
  );
}
