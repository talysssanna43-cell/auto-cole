create table if not exists public.driving_prep_progress (
    id uuid primary key default gen_random_uuid(),
    student_email text not null,
    session_id integer not null check (session_id between 1 and 50),
    session_title text not null default '',
    best_score integer not null default 0,
    total_questions integer not null default 0,
    best_percent numeric(5,2) not null default 0,
    attempts integer not null default 0,
    status text not null default 'started' check (status in ('started', 'to_review', 'validated')),
    first_reviewed_at timestamp with time zone default now(),
    last_reviewed_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    constraint driving_prep_progress_student_session_unique unique (student_email, session_id)
);

create index if not exists idx_driving_prep_progress_email
on public.driving_prep_progress (lower(student_email));

create index if not exists idx_driving_prep_progress_updated_at
on public.driving_prep_progress (updated_at desc);

alter table public.driving_prep_progress enable row level security;

drop policy if exists "Students can read their own driving prep" on public.driving_prep_progress;
create policy "Students can read their own driving prep"
on public.driving_prep_progress
for select
using (lower(student_email) = lower(coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'email', '')));

drop policy if exists "Students can write their own driving prep" on public.driving_prep_progress;
create policy "Students can write their own driving prep"
on public.driving_prep_progress
for insert
with check (lower(student_email) = lower(coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'email', '')));

drop policy if exists "Students can update their own driving prep" on public.driving_prep_progress;
create policy "Students can update their own driving prep"
on public.driving_prep_progress
for update
using (lower(student_email) = lower(coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'email', '')))
with check (lower(student_email) = lower(coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'email', '')));

drop policy if exists "Admins can read driving prep" on public.driving_prep_progress;
create policy "Admins can read driving prep"
on public.driving_prep_progress
for select
using (coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'app_role', '') = 'admin');
