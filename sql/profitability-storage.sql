alter table public.instructors
    add column if not exists monthly_salary_charges numeric(10,2) not null default 2200;

comment on column public.instructors.monthly_salary_charges
    is 'Cout mensuel salaire + charges utilise pour la rentabilite moniteur.';

create table if not exists public.instructor_profitability_settings (
    id uuid primary key default gen_random_uuid(),
    instructor_name text not null,
    effective_date date not null,
    hours_per_day numeric(5,2) not null default 10,
    salary_and_social_charges numeric(10,2) not null default 2200,
    vehicle_insurance numeric(10,2) not null default 1500,
    entoria_share numeric(10,2) not null default 75,
    parking_share numeric(10,2) not null default 83.33,
    maintenance_share numeric(10,2) not null default 157.97,
    extra_fixed_charges numeric(10,2) not null default 0,
    created_by text,
    created_at timestamptz not null default now()
);

create index if not exists idx_instructor_profitability_settings_name_date
    on public.instructor_profitability_settings (lower(instructor_name), effective_date desc);

comment on table public.instructor_profitability_settings
    is 'Historique date des heures et charges fixes utilisees pour la rentabilite des moniteurs.';

alter table public.instructor_profitability_settings enable row level security;

drop policy if exists instructor_profitability_settings_admin_all on public.instructor_profitability_settings;
