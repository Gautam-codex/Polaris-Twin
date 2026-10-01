-- Polaris Twin — Supabase schema, demo policies and seed data.
-- Paste into Supabase > SQL Editor and run. Safe to run again: tables, policies
-- and the realtime setting are only created once, and seeds only fill empty tables.
-- All seed data is illustrative, not real NCPOR data.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tables

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  station_id text not null check (station_id in ('maitri', 'bharati')),
  name text not null,
  category text not null check (category in ('fuel', 'food', 'medical', 'spares', 'science')),
  quantity numeric not null default 0,
  unit text not null,
  daily_use numeric not null default 0,
  min_level numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  station_id text not null check (station_id in ('maitri', 'bharati')),
  system text not null check (system in ('power', 'fuel', 'weather', 'water', 'comms', 'inventory')),
  severity text not null check (severity in ('info', 'warning', 'critical')),
  title text not null,
  message text not null default '',
  acknowledged boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  station_id text not null check (station_id in ('maitri', 'bharati')),
  title text not null,
  description text not null default '',
  severity text not null check (severity in ('low', 'medium', 'high')),
  status text not null default 'open' check (status in ('open', 'resolved')),
  reported_by text not null default 'Crew',
  created_at timestamptz not null default now()
);

-- Anonymous by design: no user column.
create table if not exists public.wellbeing_checkins (
  id uuid primary key default gen_random_uuid(),
  station_id text not null check (station_id in ('maitri', 'bharati')),
  mood int not null check (mood between 1 and 5),
  sleep_hours numeric not null check (sleep_hours between 0 and 24),
  energy int not null check (energy between 1 and 5),
  created_at timestamptz not null default now()
);

create table if not exists public.compliance_logs (
  id uuid primary key default gen_random_uuid(),
  station_id text not null check (station_id in ('maitri', 'bharati')),
  kind text not null check (kind in ('diesel', 'waste', 'spill', 'emission')),
  amount numeric not null,
  unit text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- RLS (demo policies)
-- anon and authenticated can read and insert; only authenticated can update.

do $$
declare
  t text;
begin
  foreach t in array array['inventory', 'alerts', 'incidents', 'wellbeing_checkins', 'compliance_logs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "demo select" on public.%I', t);
    execute format('drop policy if exists "demo insert" on public.%I', t);
    execute format('drop policy if exists "demo update" on public.%I', t);
    execute format('create policy "demo select" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "demo insert" on public.%I for insert to anon, authenticated with check (true)', t);
    execute format('create policy "demo update" on public.%I for update to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- realtime

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'alerts'
  ) then
    alter publication supabase_realtime add table public.alerts;
  end if;
end $$;

-- ---------------------------------------------------------------- seeds

-- 15 items per station. Bharati's smaller crew stocks about 80% as much.
insert into public.inventory (station_id, name, category, quantity, unit, daily_use, min_level)
select s.station_id, i.name, i.category, round(i.quantity * s.scale), i.unit, round(i.daily_use * s.scale, 2), round(i.min_level * s.scale)
from (values
  ('Aviation turbine fuel (helicopters)', 'fuel', 23500, 'L', 120, 5000),
  ('Petrol for snow vehicles', 'fuel', 3700, 'L', 70, 2000),
  ('Engine lubricating oil', 'fuel', 1800, 'L', 9, 300),
  ('LPG cylinders (kitchen)', 'fuel', 140, 'cylinders', 0.8, 25),
  ('Rice', 'food', 2300, 'kg', 22, 500),
  ('Wheat flour (atta)', 'food', 2900, 'kg', 25, 500),
  ('Lentils (dal)', 'food', 1500, 'kg', 9, 250),
  ('Frozen meat', 'food', 520, 'kg', 18, 400),
  ('Milk powder', 'food', 680, 'kg', 6, 150),
  ('Antibiotic courses', 'medical', 220, 'courses', 0.6, 40),
  ('Medical oxygen cylinders', 'medical', 44, 'cylinders', 0.25, 15),
  ('Generator oil filters', 'spares', 13, 'pcs', 0.35, 10),
  ('Generator fuel injectors', 'spares', 18, 'pcs', 0.05, 6),
  ('Liquid nitrogen', 'science', 1900, 'L', 20, 500),
  ('Radiosonde weather balloons', 'science', 150, 'pcs', 1, 30)
) as i(name, category, quantity, unit, daily_use, min_level)
cross join (values ('maitri', 1.0), ('bharati', 0.8)) as s(station_id, scale)
where not exists (select 1 from public.inventory);

insert into public.alerts (station_id, system, severity, title, message, acknowledged, created_at)
select * from (values
  ('maitri', 'power', 'critical', 'Generator 2 overheating', 'Coolant reached 108 °C. Load moved to Generator 3; radiator fan belt replaced.', true, now() - interval '9 days'),
  ('bharati', 'weather', 'critical', 'Blizzard conditions', 'Wind 86 km/h, visibility 0.2 km. Outdoor work suspended for 14 hours.', true, now() - interval '7 days'),
  ('maitri', 'water', 'warning', 'Water tank low', '18,400 L in storage after the lake intake line froze. Line heater reset.', true, now() - interval '5 days'),
  ('bharati', 'comms', 'warning', 'Satellite link degraded', 'Uplink dropped to 64 kbps for 3 hours; station ran in offline mode and synced afterwards.', true, now() - interval '3 days'),
  ('maitri', 'inventory', 'warning', 'Generator oil filters running low', '13 filters left; projected below minimum before the December resupply.', false, now() - interval '1 day'),
  ('bharati', 'power', 'info', 'Battery bank maintenance', 'Battery string B tested and rebalanced; capacity at 94%.', false, now() - interval '6 hours')
) as a(station_id, system, severity, title, message, acknowledged, created_at)
where not exists (select 1 from public.alerts);

insert into public.incidents (station_id, title, description, severity, status, reported_by, created_at)
select * from (values
  ('maitri', 'Minor diesel spill at fuel farm', 'About 6 L spilled during transfer from tank 4. Contained with absorbent pads and logged.', 'medium', 'resolved', 'Station Engineer', now() - interval '12 days'),
  ('bharati', 'Frostnip during antenna inspection', 'Crew member had frostnip on two fingers after 40 minutes outside at -31 °C wind chill. Treated on site.', 'low', 'resolved', 'Medical Officer', now() - interval '6 days'),
  ('maitri', 'Snow vehicle track damage', 'PistenBully track link cracked near the lake road. Vehicle out of service until spare arrives.', 'medium', 'open', 'Logistics Lead', now() - interval '2 days')
) as i(station_id, title, description, severity, status, reported_by, created_at)
where not exists (select 1 from public.incidents);

-- 20 anonymous check-ins spread over the last 14 days.
insert into public.wellbeing_checkins (station_id, mood, sleep_hours, energy, created_at)
select
  case when g % 2 = 0 then 'maitri' else 'bharati' end,
  2 + (g * 7) % 4,
  round((5.5 + ((g * 3) % 5) * 0.6)::numeric, 1),
  2 + (g * 5) % 4,
  now() - (g * interval '16 hours')
from generate_series(1, 20) as g
where not exists (select 1 from public.wellbeing_checkins);

-- 30 compliance rows: one per station per day over the last 15 days.
insert into public.compliance_logs (station_id, kind, amount, unit, note, created_at)
select
  case when g % 2 = 0 then 'maitri' else 'bharati' end,
  case when g = 17 then 'spill' when g % 3 = 0 then 'waste' when g % 3 = 1 then 'diesel' else 'emission' end,
  case
    when g = 17 then 6
    when g % 3 = 0 then 40 + (g * 7) % 15
    when g % 3 = 1 then 1100 + (g * 37) % 250
    else round((2.9 + ((g * 13) % 7) * 0.1)::numeric, 1)
  end,
  case when g = 17 then 'L' when g % 3 = 0 then 'kg' when g % 3 = 1 then 'L' else 't CO2' end,
  case
    when g = 17 then 'Transfer spill at fuel farm, contained with absorbent pads'
    when g % 3 = 0 then 'Segregated waste; burnables incinerated, rest packed for return shipment'
    when g % 3 = 1 then 'Daily generator diesel consumption'
    else 'CO2 from diesel at 2.68 kg per litre'
  end,
  now() - (((g - 1) / 2) * interval '1 day')
from generate_series(1, 30) as g
where not exists (select 1 from public.compliance_logs);
