# Correos de inicio de sesión

La tienda entra con un **código** que llega al correo (y opcionalmente con contraseña).

## Por qué no llegaban los correos

El servidor de correo que trae Supabase por defecto **solo entrega a los correos del equipo del proyecto** y a unos pocos por hora. A nadie más le llega. Para producción hay que conectar un SMTP propio. Recomendado: **Resend** (gratis hasta 3.000 correos/mes), que necesita un dominio propio.

## 1. Conectar Resend (necesita el dominio)

1. Crea una cuenta en https://resend.com y entra a **Domains > Add domain**. Escribe tu dominio (ej. `ivbags.co`).
2. Resend te muestra 3 o 4 registros DNS (MX, TXT/SPF, DKIM). Agrégalos en Cloudflare: **tu dominio > DNS > Records**. Espera a que Resend diga *Verified* (minutos a unas horas).
3. En Resend: **API Keys > Create API key** (permiso *Sending access*). Copia la clave `re_...`.
4. En Supabase: **Authentication > Emails > SMTP Settings > Enable custom SMTP**:
   - Sender email: `hola@tu-dominio`
   - Sender name: `IV Bags`
   - Host: `smtp.resend.com` · Port: `465`
   - Username: `resend` · Password: la clave `re_...`
5. En **Authentication > Rate Limits** sube *Emails sent per hour* (por ejemplo a 100).

## 2. Plantillas (Authentication > Emails > Templates)

Las plantillas con el diseño de la marca están en `docs/emails/`. Para cada una: abre el archivo, copia **todo** su contenido y pégalo en el campo *Message body* de la plantilla correspondiente. Cambia también el asunto.

| Plantilla en Supabase | Archivo | Asunto |
|---|---|---|
| Magic Link | `1-codigo-para-entrar.html` | `Tu código para entrar a IV Bags 🌼` |
| Confirm signup | `2-bienvenida-cuenta-nueva.html` | `Te damos la bienvenida a IV Bags ✿ aquí está tu código` |
| Reset Password | `3-nueva-contrasena.html` | `Crea una clave nueva para IV Bags` |
| Change Email Address | `4-cambio-de-correo.html` | `Confirma tu nuevo correo en IV Bags` |

Las plantillas saludan por el nombre (`{{ .Data.full_name }}`) cuando la persona ya completó su perfil; si no, dicen "¡Hola!". Para ver cómo quedan, abre el archivo en el navegador (el código aparecerá como `{{ .Token }}`).

## 3. URLs (Authentication > URL Configuration)

- **Site URL**: `https://tu-dominio` (mientras tanto, la URL de Cloudflare Workers donde está publicada la tienda).
- **Redirect URLs**: agrega `https://tu-dominio/auth/callback`, `https://*.workers.dev/auth/callback` y `http://localhost:3000/auth/callback`.

## 4. Probar

1. Abre `/iniciar-sesion`, escribe un correo que no sea del equipo y pide el código.
2. Si no llega: en Supabase revisa **Logs > Auth** y en Resend **Emails**: ahí aparece si fue rechazado y por qué.
