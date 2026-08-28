-- Proves the row-level security policies do what the migration claims.
-- Run by `npm run db:verify` against a local Postgres with the shim applied.
-- Any failure raises, so a non-zero exit means the policies are wrong.

\set ON_ERROR_STOP on

-- two accounts, created as the table owner (superuser bypasses RLS)
delete from auth.users;
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ada@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'bea@example.com');

-- ── Ada fills in her account, through RLS as a normal signed-in user ────────
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';

  insert into public.profiles (id, first_name, stage, symptoms, timezone)
    values (auth.uid(), 'Ada', 'irregular', array['sleep','anxiety','brain_fog'], 'Europe/London');

  insert into public.checkins (id, user_id, local_date, note, good_things)
    values ('aaaaaaaa-0000-0000-0000-000000000001', auth.uid(), current_date, 'Slept through.', array['slept_through']);

  insert into public.checkin_symptoms (checkin_id, user_id, symptom_key, severity) values
    ('aaaaaaaa-0000-0000-0000-000000000001', auth.uid(), 'sleep', 1),
    ('aaaaaaaa-0000-0000-0000-000000000001', auth.uid(), 'anxiety', 2);

  insert into public.interventions (user_id, name, started_on)
    values (auth.uid(), 'Magnesium glycinate', current_date - 20);

  insert into public.insights (user_id, kind, sentence, for_date, dedupe_key)
    values (auth.uid(), 'positive_streak', 'Six days without a rough night.', current_date, 'streak:sleep:6');

  insert into public.chat_messages (user_id, role, content)
    values (auth.uid(), 'user', 'Why do I wake at 3am?');

  insert into public.reports (user_id, window_start, window_end, checkin_count)
    values (auth.uid(), current_date - 59, current_date, 42);

  insert into public.events (user_id, name) values (auth.uid(), 'checkin_completed');
commit;

-- ── Ada can see her own rows ───────────────────────────────────────────────
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  do $$
  begin
    if (select count(*) from public.profiles) <> 1 then raise exception 'Ada cannot read her own profile'; end if;
    if (select count(*) from public.checkins) <> 1 then raise exception 'Ada cannot read her own check-in'; end if;
    if (select count(*) from public.checkin_symptoms) <> 2 then raise exception 'Ada cannot read her own severities'; end if;
    if (select count(*) from public.symptoms) <> 11 then raise exception 'catalog not readable'; end if;
  end
  $$;
commit;

-- ── Bea sees none of it ────────────────────────────────────────────────────
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222"}';
  do $$
  declare leaked text;
  begin
    if (select count(*) from public.profiles)         > 0 then leaked := 'profiles';         end if;
    if (select count(*) from public.checkins)         > 0 then leaked := 'checkins';         end if;
    if (select count(*) from public.checkin_symptoms) > 0 then leaked := 'checkin_symptoms'; end if;
    if (select count(*) from public.interventions)    > 0 then leaked := 'interventions';    end if;
    if (select count(*) from public.insights)         > 0 then leaked := 'insights';         end if;
    if (select count(*) from public.chat_messages)    > 0 then leaked := 'chat_messages';    end if;
    if (select count(*) from public.reports)          > 0 then leaked := 'reports';          end if;
    if leaked is not null then
      raise exception 'LEAK: Bea can read another user''s %', leaked;
    end if;
  end
  $$;
commit;

-- ── Bea cannot write into Ada's account ────────────────────────────────────
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222"}';
  do $$
  begin
    begin
      insert into public.checkins (user_id, local_date)
        values ('11111111-1111-1111-1111-111111111111', current_date);
      raise exception 'LEAK: Bea inserted a check-in owned by Ada';
    exception when insufficient_privilege then null;
    end;

    begin
      insert into public.chat_messages (user_id, role, content)
        values ('11111111-1111-1111-1111-111111111111', 'user', 'hello');
      raise exception 'LEAK: Bea inserted a chat message owned by Ada';
    exception when insufficient_privilege then null;
    end;
  end
  $$;
commit;

-- ── Bea cannot update or delete Ada's rows ─────────────────────────────────
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222"}';
  do $$
  declare touched integer;
  begin
    update public.checkins set note = 'tampered';
    get diagnostics touched = row_count;
    if touched <> 0 then raise exception 'LEAK: Bea updated % of Ada''s check-ins', touched; end if;

    delete from public.insights;
    get diagnostics touched = row_count;
    if touched <> 0 then raise exception 'LEAK: Bea deleted % of Ada''s insights', touched; end if;
  end
  $$;
commit;

-- ── events are write-only for users: no select policy at all ───────────────
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  do $$
  begin
    if (select count(*) from public.events) <> 0 then
      raise exception 'events should not be readable by users, only by the service role';
    end if;
  end
  $$;
commit;

-- ── a severity row can never disagree with its check-in's owner ────────────
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  do $$
  begin
    begin
      insert into public.checkin_symptoms (checkin_id, user_id, symptom_key, severity)
        values ('aaaaaaaa-0000-0000-0000-000000000001',
                '22222222-2222-2222-2222-222222222222', 'brain_fog', 1);
      raise exception 'severity row accepted a mismatched owner';
    exception
      when foreign_key_violation then null;
      when insufficient_privilege then null;
    end;
  end
  $$;
commit;

-- ── deleting the account truly deletes the data ────────────────────────────
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';
do $$
declare n integer;
begin
  select (select count(*) from public.profiles)
       + (select count(*) from public.checkins)
       + (select count(*) from public.checkin_symptoms)
       + (select count(*) from public.interventions)
       + (select count(*) from public.insights)
       + (select count(*) from public.chat_messages)
       + (select count(*) from public.reports)
       + (select count(*) from public.events)
    into n;
  if n <> 0 then
    raise exception 'account deletion left % rows behind', n;
  end if;
end
$$;

\echo 'RLS TESTS PASSED'
