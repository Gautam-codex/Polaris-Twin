import { Suspense } from "react";
import type { Metadata } from "next";
import { EmbedTwin } from "./embed-twin";

export const metadata: Metadata = { title: "Polaris Twin · 3D station", robots: { index: false } };

/** Full-screen 3D twin with no chrome, shown inside the crew app's WebView. */
export default function EmbedTwinPage() {
  return (
    <Suspense>
      <EmbedTwin />
    </Suspense>
  );
}
