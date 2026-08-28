# Verifying the schema without a Supabase project

`npm run db:verify` applies the real migrations to a throwaway local database
and then runs `rls-test.sql`, which tries to read, write, update and delete one
account's rows while signed in as another. Every attempt must fail. It also
checks that deleting the auth user leaves nothing behind.

`shim.sql` is a local-only stand-in for the pieces Supabase provides —
`auth.users`, `auth.uid()`, and the `anon` / `authenticated` / `service_role`
roles. It is never applied to a real project.

Starting a local server, once:

```bash
sudo -u postgres /usr/lib/postgresql/16/bin/initdb -D /var/lib/postgresql/marlow -U marlow --auth=trust
sudo -u postgres /usr/lib/postgresql/16/bin/pg_ctl -D /var/lib/postgresql/marlow \
  -o '-p 5433 -h 127.0.0.1' -l /var/lib/postgresql/pg.log start
```

The suite is only worth having if it can fail. To check it still can, break a
policy on purpose and re-run:

```sql
drop policy "read own checkins" on public.checkins;
create policy "read own checkins" on public.checkins for select to authenticated using (true);
```

It should stop with `LEAK: Bea can read another user's checkins`.
