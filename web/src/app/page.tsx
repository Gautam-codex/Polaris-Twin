export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-10 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          Maitri · Bharati
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
          Polaris Twin
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          A digital twin for India&apos;s Antarctic stations.
        </p>
      </div>
    </main>
  );
}
