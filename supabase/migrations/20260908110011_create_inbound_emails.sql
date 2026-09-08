create table public.inbound_emails (
  id uuid primary key default gen_random_uuid(),
  resend_email_id text not null unique,
  sender text,
  subject text,
  received_at timestamptz not null default now(),
  parsed_order jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.inbound_emails enable row level security;
-- El webhook usa la service role key; la app puede consultar mediante un endpoint autenticado.
create index inbound_emails_received_at_idx on public.inbound_emails (received_at desc);