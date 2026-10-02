// Public site details.

export const SITE = {
  builderName: "Commit Crew",
  builderRole: "Commit Crew · design, web, mobile and data",
  /** Direct link to the EAS-built APK. Leave empty to show "coming soon". */
  androidApkUrl: "https://expo.dev/artifacts/eas/acLNhJOerOcGciMJCq9v9aGZ8jDkbY-rqPQd33T3COM.apk",
  event: "Smart India Hackathon 2026",
  problemStatement: "PS 26060",
  organisation: "Ministry of Earth Sciences / NCPOR",
} as const;

export const NCPOR_GOA = { lat: 15.49, lon: 73.83 };

/** Great-circle distance in km (haversine). */
export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
