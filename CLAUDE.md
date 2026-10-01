# Polaris Twin — project context

I am building "Polaris Twin" alone for Smart India Hackathon 2026, problem statement 26060 (Ministry of Earth Sciences / NCPOR, theme Smart Automation): a Digital Twin platform for India's Antarctic research stations Maitri and Bharati that integrates infrastructure, energy, logistics and environmental monitoring for remote management. I have 2 days, so prefer simple, working solutions over clever ones.

Tagline: "A digital twin for India's Antarctic stations."

Core idea: an edge-first digital twin. Each station keeps working when the satellite link drops and syncs only small changes and alerts to the NCPOR control room in Goa.

Stations:
- Maitri: Schirmacher Oasis, approx lat -70.77, lon 11.73, established 1989. Fresh water from Priyadarshini Lake.
- Bharati: Larsemann Hills, approx lat -69.41, lon 76.19, established 2012. Built from shipping containers.
- Both run mainly on diesel generators; annual resupply by the Indian Scientific Expedition to Antarctica (ISEA) ship in the austral summer (Nov-Mar).

Repo layout:
- shared/  pure TypeScript logic used by both apps (types, stations, simulator, predictions). Copied into web/src/shared and app/shared by sync-shared.sh. Always edit shared/, never the copies.
- web/     Next.js website (control room dashboard + landing page)
- app/     Expo mobile app (crew app at the station)
- docs/    research, SOPs, PPT content, video script
- supabase/schema.sql

Tech stack (do not change without asking):
- Website: Next.js 16 App Router with src/ directory, TypeScript, Tailwind, shadcn/ui, Recharts, @react-three/fiber + @react-three/drei, lucide-react
- Mobile: Expo (React Native) with Expo Router, TypeScript
- Backend: Supabase (Postgres, auth, realtime) via @supabase/supabase-js
- AI copilot: Google Gemini API (gemini-3.5-flash, falling back to gemini-flash-latest; gemini-2.0-flash is retired) called only from a Next.js API route; key in GEMINI_API_KEY, optional GEMINI_MODEL override
- Weather: Open-Meteo free API (no key)
- Sensor data: deterministic time-seeded simulator in shared/simulator.ts, so every viewer sees the same values at the same time
- Deploy: Vercel (web, root directory web), EAS Build APK (app)

Design: dark "polar control room" theme. Background #0B1220, cards #111A2E, primary ice blue #38BDF8, success #22C55E, warning #F59E0B, danger #EF4444, text #E2E8F0. Font Inter. rounded-2xl cards, subtle borders, generous spacing, no clutter. Product name shown as "Polaris Twin".

Rules:
- Write complete, working files. No placeholders or TODO stubs.
- TypeScript strict, functional React components.
- Import types from the shared folder; never redefine them.
- Label simulated data in the UI as "Simulated sensor feed". Never claim real NCPOR data.
- Keep files under ~250 lines; split into components.
- Never write real keys into code or commit .env files. Use .env.example files with empty values.
- After each task: run the type check / build for the part you changed, fix any errors yourself, then tell me in 3-5 lines what you built and how to test it.
- Run terminal commands yourself when needed (installing packages, running scripts). On Windows, use commands that work in Git Bash.
