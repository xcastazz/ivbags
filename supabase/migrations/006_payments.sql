-- Pagos en línea con Wompi.
-- El servidor (con la service role key) es el único que escribe estos campos, después de verificar con Wompi.

alter table public.orders
  add column if not exists payment_status text not null default 'pending'
    check (payment_status in ('pending', 'approved', 'declined', 'voided', 'error')),
  add column if not exists payment_provider text,
  add column if not exists payment_reference text unique,
  add column if not exists payment_tx_id text,
  add column if not exists payment_details jsonb,
  add column if not exists paid_at timestamptz;

create index if not exists orders_payment_reference_idx on public.orders (payment_reference);
