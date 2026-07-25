-- Inscripciones al evento con pago vía Mercado Pago Checkout Pro.
-- Ejecutar con: supabase db push   (o pegar en el SQL Editor del dashboard)

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,

  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  document_number text,

  quantity integer not null,
  unit_price numeric(12, 2) not null,
  total_amount numeric(12, 2) not null,
  currency text not null default 'ARS',

  -- Estado de la inscripción (controlado por el webhook, nunca por el navegador)
  status text not null default 'pending',
  -- Estado crudo del pago según Mercado Pago
  payment_status text not null default 'pending',

  mercadopago_preference_id text,
  mercadopago_payment_id text,
  mercadopago_status text,
  mercadopago_status_detail text,
  external_reference text not null,

  paid_at timestamptz,
  confirmation_email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint event_registrations_external_reference_key unique (external_reference),
  constraint event_registrations_quantity_positive check (quantity > 0),
  constraint event_registrations_unit_price_positive check (unit_price > 0),
  constraint event_registrations_total_positive check (total_amount > 0),
  constraint event_registrations_total_consistent check (total_amount = unit_price * quantity),
  constraint event_registrations_status_check check (
    status in ('pending', 'confirmed', 'payment_failed', 'error')
  ),
  constraint event_registrations_payment_status_check check (
    payment_status in (
      'pending', 'approved', 'authorized', 'in_process', 'in_mediation',
      'rejected', 'cancelled', 'refunded', 'charged_back', 'error'
    )
  )
);

create index if not exists event_registrations_email_idx
  on public.event_registrations (email);
create index if not exists event_registrations_status_idx
  on public.event_registrations (status);
create index if not exists event_registrations_payment_id_idx
  on public.event_registrations (mercadopago_payment_id);
-- external_reference ya tiene índice único por la constraint de arriba.

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists event_registrations_set_updated_at on public.event_registrations;
create trigger event_registrations_set_updated_at
  before update on public.event_registrations
  for each row execute function public.set_updated_at();

-- RLS activado SIN policies: ni la anon key ni usuarios autenticados pueden
-- leer o escribir. Solo el servidor, vía Service Role Key, accede a la tabla.
alter table public.event_registrations enable row level security;
