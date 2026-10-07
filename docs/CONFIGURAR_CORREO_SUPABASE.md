# Correo de bienvenida y verificacion

En Supabase abre **Authentication > Email Templates > Magic Link**. Sustituye el asunto por:

```text
Bienvenida a ivbags: crea tu cuenta
```

Pega este contenido HTML en la plantilla:

```html
<h2>Hola, bienvenida a ivbags</h2>
<p>Que alegria tenerte en nuestro taller. Estamos listas para crear piezas con historias contigo.</p>
<p>Abre este enlace para verificar tu correo, crear tu clave y terminar tus datos:</p>
<p><a href="{{ .ConfirmationURL }}">Verificar mi cuenta</a></p>
<p>Si no creaste esta cuenta, puedes ignorar este correo.</p>
<p>Con carino,<br>ivbags</p>
```

En **Authentication > URL Configuration** agrega:

```text
https://ivbags.vercel.app/auth/callback
```

Para enviar desde un dominio propio, configura SMTP con Resend o el proveedor de correo elegido en **Project Settings > Auth > SMTP**.