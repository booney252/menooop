-- The Relief Loop: programs she can run on herself, and the record of whether
-- they worked.
--
-- Structure lives here; the words live in content/programs, keyed by
-- content_ref, so claims-reviewed copy can be edited and re-reviewed without a
-- database migration. Audio is resolved by convention: /audio/{program}/{ref}.mp3

-- ── the tracks ──────────────────────────────────────────────────────────────
create table if not exists public.programs (
  id                  text primary key,
  name                text not null,
  tagline             text not null,
  weeks               smallint not null check (weeks between 1 and 26),
  minutes_per_session smallint not null,
  -- which symptoms this track is for, and which the outcome is measured on
  target_symptoms     text[] not null,
  sort                smallint not null
);

create table if not exists public.program_sessions (
  program_id  text not null references public.programs (id) on delete cascade,
  day_index   smallint not null check (day_index >= 1),
  kind        text not null check (kind in ('audio', 'text')),
  minutes     smallint not null,
  title       text not null,
  -- key into content/programs, and the audio filename for audio sessions
  content_ref text not null,
  primary key (program_id, day_index)
);

-- The three launch tracks. Sessions are seeded by 20260201000001_seed_tracks.
insert into public.programs (id, name, tagline, weeks, minutes_per_session, target_symptoms, sort) values
  ('cool',   'Cool',   'For hot flashes and night sweats', 6, 15, array['hot_flashes','night_sweats'], 10),
  ('rest',   'Rest',   'For broken sleep and 3am waking',  4,  8, array['sleep'],                      20),
  ('steady', 'Steady', 'For mood, anxiety and a short fuse', 4, 7, array['low_mood','anxiety','irritability'], 30)
on conflict (id) do update
  set name = excluded.name, tagline = excluded.tagline, weeks = excluded.weeks,
      minutes_per_session = excluded.minutes_per_session,
      target_symptoms = excluded.target_symptoms, sort = excluded.sort;

alter table public.programs enable row level security;
alter table public.program_sessions enable row level security;

create policy "programs are readable by signed-in users"
  on public.programs for select to authenticated using (true);
create policy "sessions are readable by signed-in users"
  on public.program_sessions for select to authenticated using (true);

-- ── enrollments ─────────────────────────────────────────────────────────────
create table if not exists public.enrollments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  program_id      text not null references public.programs (id),
  started_on      date not null,
  status          text not null default 'active'
                    check (status in ('active', 'paused', 'completed', 'stopped')),
  paused_at       timestamptz,
  completed_at    timestamptz,
  -- the intervention row created on enrollment, so the existing before/after
  -- machinery treats a program exactly like magnesium or a new pillow
  intervention_id uuid references public.interventions (id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (id, user_id)
);

-- one active program at a time, enforced by the database rather than by hope
create unique index if not exists one_active_program_per_user
  on public.enrollments (user_id) where status = 'active';

create index if not exists enrollments_user_idx on public.enrollments (user_id, started_on desc);

alter table public.enrollments enable row level security;
create policy "read own enrollments"   on public.enrollments for select to authenticated using (user_id = auth.uid());
create policy "insert own enrollments" on public.enrollments for insert to authenticated with check (user_id = auth.uid());
create policy "update own enrollments" on public.enrollments for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own enrollments" on public.enrollments for delete to authenticated using (user_id = auth.uid());

-- ── one row per session played ──────────────────────────────────────────────
-- Repeats are allowed and recorded; adherence counts distinct day_index.
create table if not exists public.session_completions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null,
  enrollment_id uuid not null,
  day_index     smallint not null,
  completed_on  date not null,
  -- the one tap at the end of a session
  rating        text check (rating in ('helped', 'neutral', 'not_for_me')),
  created_at    timestamptz not null default now(),
  foreign key (enrollment_id, user_id)
    references public.enrollments (id, user_id) on delete cascade
);

create index if not exists session_completions_enrollment_idx
  on public.session_completions (enrollment_id, day_index);

alter table public.session_completions enable row level security;
create policy "read own sessions"   on public.session_completions for select to authenticated using (user_id = auth.uid());
create policy "insert own sessions" on public.session_completions for insert to authenticated with check (user_id = auth.uid());
create policy "delete own sessions" on public.session_completions for delete to authenticated using (user_id = auth.uid());

-- ── what actually happened ──────────────────────────────────────────────────
create table if not exists public.outcomes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null,
  enrollment_id uuid not null,
  symptom_key   text not null references public.symptoms (key),
  baseline      numeric(4, 2),
  endpoint      numeric(4, 2),
  delta         numeric(4, 2),
  baseline_days smallint not null default 0,
  endpoint_days smallint not null default 0,
  -- 'not_enough_data' is a first-class answer, not a failure
  verdict       text not null check (verdict in
                  ('improved', 'no_change', 'worse', 'not_enough_data')),
  sentence      text not null,
  created_at    timestamptz not null default now(),
  unique (enrollment_id, symptom_key),
  foreign key (enrollment_id, user_id)
    references public.enrollments (id, user_id) on delete cascade
);

create index if not exists outcomes_user_idx on public.outcomes (user_id, created_at desc);

alter table public.outcomes enable row level security;
create policy "read own outcomes"   on public.outcomes for select to authenticated using (user_id = auth.uid());
create policy "insert own outcomes" on public.outcomes for insert to authenticated with check (user_id = auth.uid());
create policy "update own outcomes" on public.outcomes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own outcomes" on public.outcomes for delete to authenticated using (user_id = auth.uid());

-- ── what she has been offered, so it is offered once and not again ──────────
create table if not exists public.program_recommendations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  program_id   text not null references public.programs (id),
  shown_on     date not null,
  dismissed_at timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists program_recs_user_idx
  on public.program_recommendations (user_id, shown_on desc);

alter table public.program_recommendations enable row level security;
create policy "read own recommendations"   on public.program_recommendations for select to authenticated using (user_id = auth.uid());
create policy "insert own recommendations" on public.program_recommendations for insert to authenticated with check (user_id = auth.uid());
create policy "update own recommendations" on public.program_recommendations for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── the insight feed learns two new kinds ───────────────────────────────────
alter table public.insights drop constraint if exists insights_kind_check;
alter table public.insights add constraint insights_kind_check check (kind in (
  'intervention_response', 'lag_effect', 'cycle_phase', 'positive_streak',
  'not_yet', 'program_progress', 'program_outcome'));
