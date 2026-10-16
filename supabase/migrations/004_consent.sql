-- Aceptación de términos, privacidad y tratamiento de datos (Ley 1581 de 2012) al iniciar sesión.
alter table public.profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text,
  add column if not exists marketing_opt_in boolean not null default false,
  add column if not exists marketing_updated_at timestamptz;

-- Seguridad: una persona puede editar su perfil, pero nunca darse a sí misma el rol de admin.
create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.has_admin_role() and auth.uid() is not null then
    raise exception 'Solo un admin puede cambiar roles';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles for each row execute procedure public.protect_profile_role();
