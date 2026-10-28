# Pagos en línea con Wompi

La tienda usa el **Web Checkout de Wompi**: al confirmar el pedido, la persona va a la página segura de Wompi, paga con tarjeta, PSE, Nequi, Botón Bancolombia o efectivo, y vuelve a `/pago/resultado`. Si el pago se aprueba, el pedido pasa solo a **Pago confirmado**.

## 1. Crear la cuenta

1. Regístrate en https://comercios.wompi.co como comercio (persona natural o empresa).
2. Mientras Wompi aprueba tu cuenta para cobrar de verdad, ya puedes probar todo en **modo Sandbox (pruebas)**.

## 2. Copiar las llaves

En el panel de Wompi: **Desarrolladores → Programadores**. Hay dos juegos: *Sandbox* (pruebas) y *Producción*. Empieza con Sandbox.

| En Wompi | Variable en la tienda | ¿Secreta? |
|---|---|---|
| Llave pública (`pub_test_…`) | `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` | No |
| Secreto de integridad (`test_integrity_…`) | `WOMPI_INTEGRITY_SECRET` | **Sí** |
| Secreto de eventos (`test_events_…`) | `WOMPI_EVENTS_SECRET` | **Sí** |

Además hace falta la llave de servicio de Supabase (**Project Settings → API → service_role**) en `SUPABASE_SERVICE_ROLE_KEY`. Es **secreta**: nunca la compartas ni la pongas con `NEXT_PUBLIC_`.

## 3. Ponerlas en la tienda

**En tu computador**: agrégalas al archivo `.env.local` y reinicia `npm run dev`.

**En la tienda publicada (Cloudflare)**:
- GitHub → tu repositorio → **Settings → Secrets and variables → Actions → New repository secret**: crea `NEXT_PUBLIC_WOMPI_PUBLIC_KEY`.
- Cloudflare → **Workers & Pages → ivbags → Settings → Variables and Secrets → Add**: crea como *Secret* `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET` y `SUPABASE_SERVICE_ROLE_KEY`, y como *Text* `NEXT_PUBLIC_SITE_URL` con la dirección pública de la tienda.

## 4. Base de datos

En Supabase → **SQL Editor**, ejecuta `supabase/migrations/006_payments.sql`.

## 5. Aviso automático (webhook)

En Wompi: **Desarrolladores → Programadores → URL de eventos**. Pon:

```
https://TU-TIENDA/api/webhooks/wompi
```

(Configúrala en Sandbox y, cuando pases a producción, también en Producción.) Con esto, aunque la persona cierre la pestaña antes de volver a la tienda, el pedido igual se marca como pagado.

## 6. Probar en Sandbox

1. Haz un pedido, elige **Pagar en línea** y confirma.
2. En la página de Wompi usa los datos de prueba de https://docs.wompi.co/docs/colombia/datos-de-prueba-en-sandbox/
   - Tarjeta **aprobada**: `4242 4242 4242 4242`, cualquier fecha futura y CVC.
   - Tarjeta **rechazada**: `4111 1111 1111 1111`.
   - Nequi aprobado: `3991111111`; rechazado: `3992222222`.
3. Vuelves a la tienda: debe decir **¡Pago aprobado!** y en Admin → Pedidos el pedido aparece **Pagado** y en **Pago confirmado**.

## 7. Pasar a producción

Cuando Wompi apruebe tu cuenta, cambia las tres llaves por las de **Producción** (`pub_prod_…`, `prod_integrity_…`, `prod_events_…`) y configura la URL de eventos en Producción. La tienda detecta sola si son de prueba o reales.
