# Publicar Ivbags

## 1. Backend en Render

1. En Render crea un **Web Service** desde `xcastazz/ivbags`.
2. Usa el archivo `render.yaml` con Blueprint, o configura manualmente:

```text
Root directory: backend
Build command: npm ci
Start command: npm start
Node: 22.23.2
```

3. El servicio debe llamarse `ivbags-api` para que la URL esperada sea:

```text
https://ivbags-api.onrender.com
```

Si Render asigna otra URL, cambia el fallback en `auth.js` o define `window.IVBAGS_API_URL` antes de cargarlo.

4. En Render agrega estas variables privadas:

```text
CORS_ORIGIN=https://ivbags.pages.dev
JWT_SECRET=<secreto aleatorio largo>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<contraseña nueva y segura>
SMTP_HOST=<servidor SMTP>
SMTP_PORT=587
SMTP_USER=<correo SMTP>
SMTP_PASSWORD=<contraseña o app password SMTP>
MAIL_FROM=Ivbags <hola@ivbags.co>
WOMPI_PUBLIC_KEY=<pub_test_... o pub_prod_...>
WOMPI_PRIVATE_KEY=<prv_test_... o prv_prod_...>
WOMPI_INTEGRITY_SECRET=<secreto de integridad>
WOMPI_EVENTS_SECRET=<secreto del webhook>
```

No subas esos valores a GitHub.

## 2. Frontend en Cloudflare Pages

1. Cloudflare Dashboard -> Workers & Pages -> Create -> Pages -> Connect to Git.
2. Repositorio: `xcastazz/ivbags`.
3. Configuración:

```text
Framework preset: None
Build command: vacío
Build output directory: /
Root directory: /
```

4. Publica y copia la URL de Pages, por ejemplo `https://ivbags.pages.dev`.
5. Vuelve a Render y cambia `CORS_ORIGIN` por la URL real de Pages.
6. Si el backend tiene otra URL, crea antes de `auth.js` un `api-config.js` con:

```js
window.IVBAGS_API_URL = 'https://tu-api-real.onrender.com/api';
```

## 3. SMTP

Para que llegue la verificación de correo necesitas un proveedor real, por ejemplo Resend, Brevo, Mailgun o Gmail con App Password. Completa `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` y `SMTP_PASSWORD` en Render y redeploya.

## 4. Wompi

1. Usa llaves de prueba primero.
2. Configura `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY` y `WOMPI_INTEGRITY_SECRET`.
3. Registra este webhook en Wompi:

```text
https://ivbags-api.onrender.com/api/wompi/webhook
```

4. Verifica una transacción de prueba antes de activar producción.
5. Cambia las llaves `pub_test_`/`prv_test_` por las productivas únicamente después de validar el flujo.

## 5. Dominio propio

En Cloudflare Pages -> Custom domains añade tu dominio. Después actualiza `CORS_ORIGIN` en Render con el dominio definitivo.

## Estado actual

El backend ya contiene autenticación, verificación SMTP, productos, pedidos, stock y webhook Wompi. El despliegue necesita que el propietario configure sus credenciales privadas y publique ambos servicios.
