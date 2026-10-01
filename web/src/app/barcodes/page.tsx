import type { Metadata } from "next";
import QRCode from "qrcode";

export const metadata: Metadata = { title: "Shelf labels · Polaris Twin" };

// Same codes as app/src/lib/barcodes.ts.
const LABELS: [string, string][] = [
  ["PT-INV-0001", "Aviation turbine fuel (helicopters)"],
  ["PT-INV-0002", "Petrol for snow vehicles"],
  ["PT-INV-0003", "Rice"],
  ["PT-INV-0004", "Wheat flour (atta)"],
  ["PT-INV-0005", "Frozen meat"],
  ["PT-INV-0006", "Milk powder"],
  ["PT-INV-0007", "Antibiotic courses"],
  ["PT-INV-0008", "Medical oxygen cylinders"],
  ["PT-INV-0009", "Generator oil filters"],
  ["PT-INV-0010", "Liquid nitrogen"],
];

/** Printable demo shelf labels for the crew app's Scan button. */
export default async function BarcodesPage() {
  const codes = await Promise.all(
    LABELS.map(async ([code, name]) => ({
      code,
      name,
      svg: await QRCode.toString(code, { type: "svg", margin: 1, color: { dark: "#0F1F33", light: "#FFFFFF" } }),
    })),
  );
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-foreground">Polaris Twin shelf labels</h1>
      <p className="mt-1 mb-8 text-sm text-muted-foreground">
        Demo labels for the crew app. Open Inventory → Scan and point the camera at a code. Print this page or scan it from a laptop screen.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 print:grid-cols-5">
        {codes.map((c) => (
          <figure key={c.code} className="break-inside-avoid rounded-lg border border-border bg-card p-3 text-center">
            <div className="mx-auto w-full max-w-[140px]" dangerouslySetInnerHTML={{ __html: c.svg }} />
            <figcaption className="mt-2 text-xs font-medium text-foreground">{c.name}</figcaption>
            <p className="font-mono text-[10px] text-muted-foreground">{c.code}</p>
          </figure>
        ))}
      </div>
    </main>
  );
}
