# ivbags

Tienda y operacion de taller en Next.js 16 + Supabase. La portada termina intencionalmente en **Personaliza tu bolso**; las paginas legales, cuenta y administracion se acceden por URL, no como contenido extra de la portada.

## Desarrollo local

1. Copia `.env.example` a `.env.local` y completa las claves de Supabase.
2. En Supabase, ejecuta `supabase/migrations/001_initial_schema.sql` en el SQL Editor.
3. En **Authentication > URL Configuration**, agrega `http://localhost:3000/auth/callback` como redirect URL.
4. Ejecuta `npm run dev` y abre `http://localhost:3000`.

Para hacer administrador al primer usuario, en el SQL Editor ejecuta:

```sql
update public.profiles set role = 'admin' where id = 'UUID_DEL_USUARIO';
```

## Produccion

1. Crea un proyecto en Vercel e importa este repositorio GitHub.
2. Carga las variables de `.env.example` en Vercel. Nunca publiques `SUPABASE_SERVICE_ROLE_KEY` en el navegador.
3. Configura `NEXT_PUBLIC_SITE_URL` con la URL final. En Supabase, agrega `https://tu-dominio.com/auth/callback` a redirect URLs y configura el template de correo con la URL de confirmacion de Supabase.
4. En Vercel, agrega el dominio comprado en **Settings > Domains**. Configura los DNS que Vercel muestre en el registrador. No es posible registrar o delegar un dominio sin acceso a la cuenta del proveedor.
5. Para correo transaccional de pedidos y facturas, verifica el dominio en Resend y añade `RESEND_API_KEY` y `RESEND_FROM_EMAIL`. Los enlaces de acceso y confirmacion los envía Supabase Auth.

## Operacion y legal

- Publica las rutas `/legal/privacidad`, `/legal/terminos`, `/legal/envios-y-devoluciones` y `/legal/cookies` tras revisar los textos con asesoria legal local.
- Completa razon social, NIT, direccion, canales de PQR y plazos reales antes de vender. Los documentos incluidos son plantillas y no sustituyen asesoria juridica.
- Confirma obligaciones de facturacion electronica DIAN con contador o proveedor tecnologico. El esquema genera comprobantes operativos, no reemplaza una integracion certificada por DIAN.This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
