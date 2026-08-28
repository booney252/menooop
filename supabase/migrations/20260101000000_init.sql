-- Marlow — initial schema.
--
-- Everything here holds sensitive personal health data. Two rules run through
-- the whole file: row-level security is on for every table that holds user
-- rows, and every foreign key cascades from auth.users so that deleting an
-- account genuinely deletes the data rather than orphaning it.

-- ── symptom catalog ─────────────────────────────────────────────────────────
-- Static reference data. Readable by any signed-in user, writable by nobody
-- through the API (migrations only).
create table if not exists public.symptoms (
  key        text primary key,
  label      text not null,
  aside      text not null,
  -- 'burden' symptoms are the ones she wants less of; 'positive' is the one
  -- she wants more of, and it is scored the same way but read in reverse.
  kind       text not null default 'burden' check (kind in ('burden', 'positive')),
  sort       smallint not null
);

insert into public.symptoms (key, label, aside, kind, sort) values
  ('hot_flashes',  'Hot flashes',          'The heat that starts in your chest.',        'burden',   10),
  ('night_sweats', 'Night sweats',         'Waking up damp, changing the sheets.',       'burden',   20),
  ('sleep',        'Waking at 3am',        'Falling asleep is fine, staying asleep isn''t.', 'burden', 30),
  ('anxiety',      'Anxiety',              'The hum that arrives before the thought.',   'burden',   40),
  ('irritability', 'Short fuse',           'The turn you can feel coming.',              'burden',   50),
  ('brain_fog',    'Brain fog',            'Words, names, why you walked in here.',      'burden',   60),
  ('fatigue',      'Flat energy',          'Tired in a way that sleep doesn''t fix.',    'burden',   70),
  ('joint_aches',  'Aching joints',        'Hands, hips and knees in the morning.',      'burden',   80),
  ('cravings',     'Cravings and snacking','Standing at the fridge at four o''clock.',   'burden',   90),
  ('low_mood',     'Low mood',             'Flat, or closer to tears than usual.',       'burden',  100),
  ('like_myself',  'Feeling like myself',  'The days that feel like you again.',         'positive', 110)
on conflict (key) do update
  set label = excluded.label,
      aside = excluded.aside,
      kind  = excluded.kind,
      sort  = excluded.sort;

alter table public.symptoms enable row level security;

create policy "symptoms are readable by signed-in users"
  on public.symptoms for select
  to authenticated
  using (true);

-- ── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  first_name    text,
  stage         text check (stage in ('cycling', 'irregular', 'stopped')),
  -- she picks three to six; the engine needs at least three to say anything
  symptoms      text[] not null default '{}',
  timezone      text not null default 'UTC',
  -- optional daily email nudge, off unless she turns it on
  nudge_enabled boolean not null default false,
  nudge_hour    smallint check (nudge_hour between 0 and 23),
  last_nudged_on date,
  onboarded_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint symptoms_count check (
    coalesce(array_length(symptoms, 1), 0) = 0
    or array_length(symptoms, 1) between 3 and 6
  )
);

alter table public.profiles enable row level security;

create policy "read own profile"   on public.profiles for select to authenticated using (id = auth.uid());
create policy "insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "delete own profile" on public.profiles for delete to authenticated using (id = auth.uid());

-- ── check-ins ───────────────────────────────────────────────────────────────
-- One row per user per local calendar day. local_date is computed server-side
-- from her profile timezone, never taken from the client.
create table if not exists public.checkins (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  local_date     date not null,
  note           text,
  good_things    text[] not null default '{}',
  period_started boolean not null default false,
  -- how long the flow took, in milliseconds; feeds the "under 20 seconds" claim
  duration_ms    integer,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, local_date),
  -- lets checkin_symptoms carry user_id and still be provably consistent
  unique (id, user_id)
);

create index if not exists checkins_user_date_idx on public.checkins (user_id, local_date desc);

alter table public.checkins enable row level security;

create policy "read own checkins"   on public.checkins for select to authenticated using (user_id = auth.uid());
create policy "insert own checkins" on public.checkins for insert to authenticated with check (user_id = auth.uid());
create policy "update own checkins" on public.checkins for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own checkins" on public.checkins for delete to authenticated using (user_id = auth.uid());

-- ── per-symptom severities ──────────────────────────────────────────────────
-- user_id is denormalised so RLS is a single-column check with no join, and
-- the composite foreign key makes it impossible for it to disagree with the
-- parent check-in.
create table if not exists public.checkin_symptoms (
  checkin_id  uuid not null,
  user_id     uuid not null,
  symptom_key text not null references public.symptoms (key),
  -- 0 not today · 1 barely there · 2 noticeable · 3 rough
  severity    smallint not null check (severity between 0 and 3),
  primary key (checkin_id, symptom_key),
  foreign key (checkin_id, user_id) references public.checkins (id, user_id) on delete cascade
);

create index if not exists checkin_symptoms_user_symptom_idx
  on public.checkin_symptoms (user_id, symptom_key);

alter table public.checkin_symptoms enable row level security;

create policy "read own severities"   on public.checkin_symptoms for select to authenticated using (user_id = auth.uid());
create policy "insert own severities" on public.checkin_symptoms for insert to authenticated with check (user_id = auth.uid());
create policy "update own severities" on public.checkin_symptoms for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own severities" on public.checkin_symptoms for delete to authenticated using (user_id = auth.uid());

-- ── interventions ───────────────────────────────────────────────────────────
create table if not exists public.interventions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null check (length(btrim(name)) between 1 and 80),
  started_on date not null,
  ended_on   date,
  created_at timestamptz not null default now(),
  constraint ends_after_it_starts check (ended_on is null or ended_on >= started_on)
);

create index if not exists interventions_user_started_idx
  on public.interventions (user_id, started_on desc);

alter table public.interventions enable row level security;

create policy "read own interventions"   on public.interventions for select to authenticated using (user_id = auth.uid());
create policy "insert own interventions" on public.interventions for insert to authenticated with check (user_id = auth.uid());
create policy "update own interventions" on public.interventions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own interventions" on public.interventions for delete to authenticated using (user_id = auth.uid());

-- ── insights ────────────────────────────────────────────────────────────────
-- Generated by the rule engine, at most one new one a day. dedupe_key is what
-- stops the same observation being served twice.
create table if not exists public.insights (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (kind in (
                'intervention_response', 'lag_effect', 'cycle_phase',
                'positive_streak', 'not_yet')),
  subject    text,
  sentence   text not null,
  detail     text,
  payload    jsonb not null default '{}'::jsonb,
  for_date   date not null,
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);

create index if not exists insights_user_date_idx on public.insights (user_id, for_date desc);

alter table public.insights enable row level security;

create policy "read own insights"   on public.insights for select to authenticated using (user_id = auth.uid());
create policy "insert own insights" on public.insights for insert to authenticated with check (user_id = auth.uid());
create policy "delete own insights" on public.insights for delete to authenticated using (user_id = auth.uid());

-- ── chat ────────────────────────────────────────────────────────────────────
create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_user_created_idx
  on public.chat_messages (user_id, created_at);

alter table public.chat_messages enable row level security;

create policy "read own messages"   on public.chat_messages for select to authenticated using (user_id = auth.uid());
create policy "insert own messages" on public.chat_messages for insert to authenticated with check (user_id = auth.uid());
create policy "delete own messages" on public.chat_messages for delete to authenticated using (user_id = auth.uid());

-- ── reports ─────────────────────────────────────────────────────────────────
create table if not exists public.reports (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  window_start       date not null,
  window_end         date not null,
  checkin_count      integer not null default 0,
  say_note           text,
  created_at         timestamptz not null default now(),
  -- the soft "did you have your appointment?" loop
  outcome_logged_at  timestamptz,
  outcome_went       text check (outcome_went in ('heard', 'mixed', 'dismissed', 'not_yet')),
  outcome_note       text,
  outcome_dismissed_at timestamptz
);

create index if not exists reports_user_created_idx on public.reports (user_id, created_at desc);

alter table public.reports enable row level security;

create policy "read own reports"   on public.reports for select to authenticated using (user_id = auth.uid());
create policy "insert own reports" on public.reports for insert to authenticated with check (user_id = auth.uid());
create policy "update own reports" on public.reports for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own reports" on public.reports for delete to authenticated using (user_id = auth.uid());

-- ── events ──────────────────────────────────────────────────────────────────
-- Product analytics. She can write her own; only the service role reads them,
-- which is what the founder-only admin page uses.
create table if not exists public.events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  props      jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_name_created_idx on public.events (name, created_at desc);
create index if not exists events_user_created_idx on public.events (user_id, created_at);

alter table public.events enable row level security;

create policy "insert own events" on public.events for insert to authenticated with check (user_id = auth.uid());

-- ── updated_at ──────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger checkins_touch before update on public.checkins
  for each row execute function public.touch_updated_at();
