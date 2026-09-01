create table if not exists public.exam_requests (
    id uuid primary key default gen_random_uuid(),
    student_email text not null,
    student_name text not null,
    student_phone text,
    instructor text,
    requested_by_email text,
    requested_by_role text check (requested_by_role in ('admin', 'instructor')),
    pack text,
    pack_label text,
    transmission_type text,
    pack_started_at timestamptz,
    deadline_days integer not null default 365,
    deadline_at timestamptz,
    status text not null default 'pending' check (status in ('pending', 'scheduled', 'dismissed')),
    comment text,
    scheduled_exam_id uuid,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_exam_requests_status_deadline
on public.exam_requests(status, deadline_at);

create index if not exists idx_exam_requests_student
on public.exam_requests(lower(student_email));

create index if not exists idx_exam_requests_instructor
on public.exam_requests(instructor);

alter table public.exam_requests enable row level security;

drop policy if exists exam_requests_admin_all on public.exam_requests;
create policy exam_requests_admin_all
on public.exam_requests for all
using (coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'app_role', '') = 'admin')
with check (coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'app_role', '') = 'admin');

drop policy if exists exam_requests_instructor_insert on public.exam_requests;
create policy exam_requests_instructor_insert
on public.exam_requests for insert
with check (coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'app_role', '') = 'instructor');

drop policy if exists exam_requests_instructor_read_own on public.exam_requests;
create policy exam_requests_instructor_read_own
on public.exam_requests for select
using (
    coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'app_role', '') = 'instructor'
    and lower(coalesce(requested_by_email, '')) = lower(coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'email', ''))
);
