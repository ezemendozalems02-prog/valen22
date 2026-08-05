-- Embudo de visitantes: qué parte de la gente que entra avanza a cada paso
-- (cuestionario, mira el precio, inicia el pago, compra).
-- Ejecutar con: supabase db push   (o pegar en el SQL Editor del dashboard)

-- Identificador anónimo por sesión de navegador (sessionStorage, sin cookies
-- de terceros ni datos personales), para poder unir los pasos de un mismo
-- visitante sin guardar quién es.
alter table public.page_visits
  add column if not exists visitor_id uuid;

alter table public.event_registrations
  add column if not exists visitor_id uuid;

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null,
  event text not null,
  meta jsonb,
  created_at timestamptz not null default now(),
  constraint analytics_events_event_check check (
    event in (
      'onboarding_started',
      'improvement_area_selected',
      'life_score_selected',
      'responsibility_selected',
      'onboarding_completed',
      'onboarding_restarted',
      'checkout_viewed',
      'checkout_initiated'
    )
  )
);

create index if not exists analytics_events_event_visitor_idx
  on public.analytics_events (event, visitor_id);

alter table public.analytics_events enable row level security;
