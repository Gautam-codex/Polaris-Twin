import { NAV_ITEMS } from "@/lib/nav";
import { PageHeader } from "./page-header";

/** Frame for a dashboard module whose live view arrives in a later build step. */
export function ModulePage({ href }: { href: string }) {
  const item = NAV_ITEMS.find((n) => n.href === href);
  if (!item) throw new Error(`No nav item for ${href}`);
  return (
    <>
      <PageHeader title={item.label} description={item.description} />
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card p-10 text-center">
        <item.icon className="size-8 text-muted-foreground" strokeWidth={1.5} />
        <p className="text-base font-medium text-foreground">{item.label} module</p>
        <p className="max-w-md text-sm text-muted-foreground">{item.description}.</p>
      </div>
    </>
  );
}
