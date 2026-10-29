-- Fotos de referencia en las cotizaciones de bolsos personalizados (se suben al bucket custom-photos del 013).
alter table public.custom_requests add column if not exists reference_images text[] not null default '{}';
