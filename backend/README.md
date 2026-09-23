# Ivbags API

Backend inicial para convertir la demo estática en una tienda real.

## Incluye

- Registro, verificación por correo y login con JWT.
- Roles `customer`, `admin` y `owner`.
- SQLite para usuarios, productos y pedidos.
- Stock y catálogo.
- Pedidos con datos de entrega, WhatsApp y diseño personalizado.
- Endpoint de firma de integridad para Wompi.
- Webhook de actualización de transacciones Wompi.
- Carga de imágenes de productos.

## Ejecutar localmente

Requiere Node.js 20+.

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm start
```

Prueba rápida:

```powershell
Invoke-RestMethod http://localhost:8787/api/health
```

## Antes de producción

1. Cambiar `JWT_SECRET`, `ADMIN_PASSWORD` y todos los valores de ejemplo.
2. Configurar SMTP real para verificación de correo.
3. Usar las llaves reales de Wompi y registrar `/api/wompi/webhook` en Wompi.
4. Migrar SQLite a PostgreSQL si se desplegará con múltiples instancias.
5. Mover `uploads/` a almacenamiento privado (S3, Cloudinary o Supabase Storage).
6. Conectar el frontend a `API_URL` y retirar la autenticación basada en `localStorage`.
7. Añadir rate limiting, validación de payloads, HTTPS y backups.
