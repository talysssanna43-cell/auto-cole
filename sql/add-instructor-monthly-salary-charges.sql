alter table public.instructors
    add column if not exists monthly_salary_charges numeric(10,2) not null default 2200;

comment on column public.instructors.monthly_salary_charges
    is 'Cout mensuel salaire + charges utilise pour la rentabilite moniteur.';
