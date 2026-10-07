"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { BarChart3, Box, CircleDollarSign, FileText, PackagePlus, ShoppingBag, Users } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Product = { id: string; name: string; category: string; price_cents: number; inventory_count: number; active: boolean };
type Metrics = { revenue: number; orders: number; customers: number; pending: number };

const chartData = [
  { day: "Lun", sales: 4 }, { day: "Mar", sales: 7 }, { day: "Mie", sales: 5 }, { day: "Jue", sales: 9 }, { day: "Vie", sales: 12 }, { day: "Sab", sales: 8 }, { day: "Dom", sales: 6 },
];

const formatCurrency = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value / 100);

export function AdminDashboard({ metrics, initialProducts }: { metrics: Metrics; initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"), category: form.get("category"), priceCents: Math.round(Number(form.get("price")) * 100),
      inventoryCount: Number(form.get("inventory")), madeToOrder: form.get("madeToOrder") === "on", description: form.get("description"), imageUrl: form.get("imageUrl"),
    };
    const response = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) return setMessage(result.error ?? "No fue posible guardar el producto.");
    setProducts((current) => [result.product, ...current]);
    event.currentTarget.reset();
    setMessage("Producto guardado y visible en el catalogo.");
  }

  const cards = [
    { label: "Ventas del mes", value: formatCurrency(metrics.revenue), icon: CircleDollarSign, tone: "olive" },
    { label: "Pedidos", value: String(metrics.orders), icon: ShoppingBag, tone: "rose" },
    { label: "Clientes", value: String(metrics.customers), icon: Users, tone: "butter" },
    { label: "Por producir", value: String(metrics.pending), icon: Box, tone: "sage" },
  ];

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar"><Link className="brand" href="/"><span className="brand-mark">iV</span>bags</Link><p>taller admin</p><nav><a className="selected" href="/admin"><BarChart3 size={16} />Resumen</a><a href="#productos"><ShoppingBag size={16} />Productos</a><a href="#facturas"><FileText size={16} />Facturas</a></nav></aside>
      <section className="admin-content">
        <header className="admin-heading"><div><p className="eyebrow">operacion del taller</p><h1>Buenos dias, ivbags</h1><p>Todo lo que paso en el negocio esta aqui.</p></div><a className="button button-solid" href="#nuevo-producto"><PackagePlus size={14} />Nuevo producto</a></header>
        <div className="metric-grid">{cards.map(({ label, value, icon: Icon, tone }) => <article className={`metric-card ${tone}`} key={label}><Icon size={20} /><p>{label}</p><strong>{value}</strong></article>)}</div>
        <section className="admin-panel chart-panel"><div><p className="eyebrow">esta semana</p><h2>Pedidos recibidos</h2></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><XAxis dataKey="day" axisLine={false} tickLine={false} /><YAxis hide /><Tooltip cursor={{ fill: "#fbf5ec" }} /><Bar dataKey="sales" fill="#6d4546" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
        <section id="productos" className="admin-grid"><div className="admin-panel product-list"><div className="panel-title"><div><p className="eyebrow">catalogo</p><h2>Productos activos</h2></div><span>{products.length} productos</span></div><div className="product-table">{products.length === 0 ? <p className="empty-state">Todavia no hay productos. Agrega el primero desde el formulario.</p> : products.map((product) => <div key={product.id}><span className="mini-thumb">✦</span><p><strong>{product.name}</strong><small>{product.category} · {product.inventory_count} disponibles</small></p><b>{formatCurrency(product.price_cents)}</b></div>)}</div></div>
          <form id="nuevo-producto" className="admin-panel product-form" onSubmit={addProduct}><p className="eyebrow">nuevo en el catalogo</p><h2>Crear producto</h2><label>Nombre<input name="name" required placeholder="Tote pensamiento" /></label><div className="form-pair"><label>Categoria<select name="category" defaultValue="Bolsos"><option>Bolsos</option><option>Prendas</option><option>Accesorios</option><option>Personalizados</option></select></label><label>Precio COP<input name="price" type="number" min="0" step="1" required placeholder="95000" /></label></div><label>Inventario<input name="inventory" type="number" min="0" defaultValue="0" /></label><label>Descripcion<textarea name="description" placeholder="Detalles de la pieza y materiales." /></label><label>URL de imagen<input name="imageUrl" type="url" placeholder="https://..." /></label><label className="checkbox"><input name="madeToOrder" type="checkbox" /> Hecho por encargo</label><button className="button button-solid" type="submit" disabled={saving}>{saving ? "Guardando..." : "Publicar producto"}</button>{message && <p className="form-message" role="status">{message}</p>}</form>
        </section>
        <section id="facturas" className="admin-panel invoice-note"><FileText size={20} /><div><h2>Facturacion lista para conectar</h2><p>Los pedidos, clientes y totales se registran en Supabase. Antes de emitir factura electronica, conecta un proveedor DIAN certificado y valida el regimen tributario con tu contador.</p></div></section>
      </section>
    </main>
  );
}