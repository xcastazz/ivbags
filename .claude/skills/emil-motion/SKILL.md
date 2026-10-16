---
name: emil-motion
description: Animation and interaction principles in the style of Emil Kowalski (Sonner, Vaul). Use whenever adding or changing animations, transitions, hover/press states, toasts, drawers, modals or any UI motion in ivbags.
---

# Motion para ivbags (estilo Emil Kowalski)

## Cuándo animar
- Anima solo si ayuda: da feedback, explica un cambio de estado o conecta dos vistas.
- Nada que el usuario vea cientos de veces al día debe animarse lento (o animarse en absoluto).
- Interacciones de teclado y acciones repetitivas: sin animación.

## Easing y duración
- Usa los tokens de `src/app/globals.css`:
  - `--ease-out` `cubic-bezier(.23,1,.32,1)` para entradas, hover y feedback (la mayoría de casos).
  - `--ease-in-out` `cubic-bezier(.77,0,.175,1)` para elementos que se mueven dentro de la pantalla.
  - `--ease-drawer` `cubic-bezier(.32,.72,0,1)` para paneles/drawers.
- Nunca `ease-in` en UI: se siente lento al empezar.
- Duraciones: micro-interacciones 120–200ms, entradas 300–500ms, nada de UI por encima de ~500ms.
- Salidas más rápidas que entradas.

## Reglas de implementación
- Transiciona propiedades concretas (`transform`, `opacity`, `background-color`), nunca `transition: all`.
- Anima solo `transform` y `opacity` cuando sea posible (GPU, sin layout).
- Feedback al presionar: `:active { transform: scale(.97) }` en botones y elementos clicables.
- No entres desde `scale(0)`: empieza en `scale(.95)` + `opacity:0`.
- Hover solo con puntero real: `@media (hover:hover) and (pointer:fine)`.
- Escalona listas con retrasos cortos (30–60ms por item), no largos.
- Respeta `prefers-reduced-motion`: quita movimiento, deja cambios de opacidad/color.
- Prefiere transiciones CSS (interrumpibles) sobre keyframes para estados que cambian con la interacción.

## Componentes
- Notificaciones: `toast` de `sonner` (el `<Toaster />` ya está en `src/app/layout.tsx`). No muestres mensajes de estado inline para resultados de acciones; usa `toast.success` / `toast.error`.
- Paneles desde abajo en móvil (menú, carrito, filtros): `Drawer` de `vaul` (ver `src/components/mobile-menu.tsx`). El wrapper `vaul-drawer-wrapper` ya está en el layout.
- Estados de carga en botones: deshabilita y cambia el texto (`"Guardando..."`), sin spinners grandes.
