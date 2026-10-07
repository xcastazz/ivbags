# Correo de bienvenida y verificacion

En Supabase abre **Authentication > Email Templates > Confirm signup**. Sustituye el asunto por:

```text
Bienvenida a ivbags: verifica tu cuenta
```

Pega este contenido HTML en la plantilla:

```html
<h2>Hola, bienvenida a ivbags</h2>
<p>Que alegria tenerte en nuestro taller. Estamos listas para crear piezas con historias contigo.</p>
<p>Confirma tu correo para activar tu cuenta y terminar tus datos:</p>
<p><a href="{{ .ConfirmationURL }}">Verificar mi cuenta</a></p>
<p>Si no creaste esta cuenta, puedes ignorar este correo.</p>
<p>Con carino,<br>ivbags</p>
```

En **Authentication > URL Configuration** agrega:

```text
https://ivbags.vercel.app/auth/callback
```

Mantén habilitada la opcion **Confirm email** en **Authentication > Providers > Email**. Para enviar desde un dominio propio, configura SMTP con Resend o el proveedor de correo elegido en **Project Settings > Auth > SMTP**.