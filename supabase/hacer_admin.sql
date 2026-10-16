-- Da acceso al panel del taller. Cambia el correo y ejecuta en Supabase > SQL Editor.

-- 1. Crea el perfil de las cuentas que se registraron antes de instalar la base.
insert into public.profiles (id, full_name)
select u.id, u.raw_user_meta_data ->> 'full_name'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- 2. Marca la cuenta como admin.
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'TU-CORREO@gmail.com');

-- 3. Revisa: debe aparecer tu correo con rol admin.
select u.email, p.role from public.profiles p join auth.users u on u.id = p.id order by p.role;
