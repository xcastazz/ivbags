"use client";

import { Drawer } from "vaul";

const links = [["#productos", "Productos"], ["#personaliza", "Personaliza"], ["/nosotras", "Nosotras"], ["/blog", "Blog"], ["/contacto", "Contacto"]];

export function MobileMenu() {
  return (
    <Drawer.Root>
      <Drawer.Trigger className="menu-trigger" aria-label="Abrir menu">☰</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="drawer-overlay" />
        <Drawer.Content className="drawer-content">
          <div className="drawer-handle" aria-hidden />
          <Drawer.Title className="drawer-title">Menu</Drawer.Title>
          <Drawer.Description className="sr-only">Navegacion de ivbags</Drawer.Description>
          <nav className="drawer-links">{links.map(([href, label]) => <Drawer.Close asChild key={href}><a href={href}>{label}</a></Drawer.Close>)}</nav>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
