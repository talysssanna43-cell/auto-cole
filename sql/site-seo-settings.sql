create table if not exists public.site_seo_settings (
    page_path text primary key,
    title text not null check (char_length(title) between 20 and 70),
    description text not null check (char_length(description) between 80 and 180),
    h1 text not null check (char_length(h1) between 10 and 140),
    updated_at timestamptz not null default now(),
    updated_by text
);

comment on table public.site_seo_settings is
    'Overrides éditoriaux des pages publiques, administrés côté serveur.';

alter table public.site_seo_settings enable row level security;

revoke all on table public.site_seo_settings from anon, authenticated;

create index if not exists idx_site_seo_settings_updated_at
    on public.site_seo_settings (updated_at desc);
