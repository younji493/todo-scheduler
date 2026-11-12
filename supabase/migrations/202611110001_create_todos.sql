-- Auth accounts, passwords, email verification and names are managed by Supabase Auth.
create table public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  start_date date not null,
  due_date date not null check (due_date >= start_date),
  duration_minutes integer not null default 60 check (duration_minutes between 30 and 960 and duration_minutes % 30 = 0),
  start_at timestamptz,
  end_at timestamptz,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  constraint valid_todo_times check (
    (start_at is null and end_at is null) or
    (start_at is not null and end_at is not null and end_at > start_at
      and extract(epoch from (end_at - start_at)) = duration_minutes * 60
      and (start_at at time zone 'Asia/Seoul')::date = start_date
      and (end_at at time zone 'Asia/Seoul')::date = due_date)
  )
);
create index todos_user_created_idx on public.todos(user_id, created_at);
alter table public.todos enable row level security;
revoke all on public.todos from anon, authenticated;
grant select, insert on public.todos to authenticated;
grant update (completed) on public.todos to authenticated;
create policy "Read own todos" on public.todos for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Insert own todos" on public.todos for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Complete own todos" on public.todos for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
