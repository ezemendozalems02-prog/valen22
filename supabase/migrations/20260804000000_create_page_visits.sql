-- Conteo propio de visitas a la landing (no depende de la API paga de
-- Vercel Analytics). Una fila por sesión de navegador, no por página vista:
-- el script del cliente solo manda el aviso una vez por sessionStorage.
-- Ejecutar con: supabase db push   (o pegar en el SQL Editor del dashboard)

create table if not exists public.page_visits (
  id uuid primary key default gen_random_uuid(),
  path text not null default '/',
  referrer text,
  created_at timestamptz not null default now()
);

create index if not exists page_visits_created_at_idx
  on public.page_visits (created_at);

-- RLS activado SIN policies: mismo patrón que event_registrations. Solo el
-- servidor, vía Service Role Key, puede insertar o leer.
alter table public.page_visits enable row level security;
