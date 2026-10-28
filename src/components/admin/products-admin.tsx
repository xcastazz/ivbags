"use client";

import { FormEvent, useEffect, useState } from "react";
import { Drawer } from "vaul";
import { Eye, EyeOff, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { CATEGORIES, isVideoUrl, type Product, type ProductOption } from "@/lib/types";
import { money, slugify } from "@/lib/format";
import { centsFromCop, copFromCents, db, Empty, ImageList, LoadError, Loading, mutate, PageHead, useQuery, VideoList } from "./kit";

const EMPTY: Product = { id: "", slug: "", name: "", category: "Bolsos", tag: "", description: "", details: "", price_cents: 0, images: [], options: [], made_to_order: false, inventory_count: 0, featured: false, is_pet: false, active: true, sort_order: 0 };

/** "Talla: S, M, L | Mismo precio" ⇄ opciones */
const optionsToText = (opts: ProductOption[]) => opts.map((o) => `${o.label}: ${o.values.join(", ")}${o.hint ? ` | ${o.hint}` : ""}`).join("\n");
const textToOptions = (text: string): ProductOption[] => text.split("\n").map((line) => line.trim()).filter((l) => l.includes(":")).map((line) => {
  const [head, hint] = line.split("|").map((s) => s.trim());
  const [label, values] = [head.slice(0, head.indexOf(":")).trim(), head.slice(head.indexOf(":") + 1)];
  return { key: slugify(label), label, values: values.split(",").map((v) => v.trim()).filter(Boolean), ...(hint ? { hint } : {}) };
}).filter((o) => o.label && o.values.length);

export function ProductsAdmin() {
  const { data, loading, failed, reload } = useQuery(async () => db().from("products").select("*").order("sort_order").order("created_at", { ascending: false }));
  const [editing, setEditing] = useState<Product | null>(null);
  const [filter, setFilter] = useState("Todos");
  const products = (data ?? []) as Product[];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- open the editor from the "Nuevo producto" shortcut
    if (new URLSearchParams(window.location.search).get("nuevo")) setEditing(EMPTY);
  }, []);

  async function patch(p: Product, change: Partial<Product>, ok: string) {
    if (await mutate(db().from("products").update(change).eq("id", p.id), ok, ["products"])) reload();
  }
  async function remove(p: Product) {
    if (!confirm(`¿Eliminar "${p.name}"? Los pedidos anteriores conservan su nombre y precio.`)) return;
    if (await mutate(db().from("products").delete().eq("id", p.id), "Producto eliminado", ["products"])) reload();
  }

  const shown = products.filter((p) => filter === "Todos" || p.category === filter);

  return (
    <>
      <PageHead title="Productos" text="Todo lo que se ve en la tienda. Los cambios aparecen de inmediato." action={<button className="button solid" onClick={() => setEditing(EMPTY)}><Plus size={14} />Nuevo producto</button>} />
      <div className="admin-filters">{["Todos", ...CATEGORIES].map((c) => <button key={c} className={filter === c ? "on" : ""} onClick={() => setFilter(c)}>{c} <small>{c === "Todos" ? products.length : products.filter((p) => p.category === c).length}</small></button>)}</div>
      <section className="admin-panel">
        {loading ? <Loading /> : failed ? <LoadError text={failed} retry={reload} /> : shown.length === 0 ? <Empty>No hay productos aquí. Crea el primero con “Nuevo producto”.</Empty> : (
          <div className="admin-table">
            {shown.map((p) => (
              <div className={`admin-row${p.active ? "" : " muted"}`} key={p.id}>
                {p.images.find((u) => !isVideoUrl(u)) ? <img className="row-thumb" src={p.images.find((u) => !isVideoUrl(u))} alt="" /> : <span className="row-thumb" />}
                <div className="row-main"><strong>{p.name}</strong><small>{p.category} · {p.made_to_order ? "Por encargo" : `${p.inventory_count} disponibles`}{p.active ? "" : " · Oculto"}</small></div>
                <b className="row-price">{money(p.price_cents)}</b>
                <div className="row-actions">
                  <button title={p.featured ? "Quitar de destacados" : "Destacar"} aria-pressed={p.featured} onClick={() => patch(p, { featured: !p.featured }, p.featured ? "Ya no está destacado" : "Destacado")}><Star size={16} fill={p.featured ? "currentColor" : "none"} /></button>
                  <button title={p.active ? "Ocultar de la tienda" : "Mostrar en la tienda"} onClick={() => patch(p, { active: !p.active }, p.active ? "Oculto de la tienda" : "Visible en la tienda")}>{p.active ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                  <button title="Editar" onClick={() => setEditing(p)}><Pencil size={16} /></button>
                  <button title="Eliminar" onClick={() => remove(p)}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <ProductEditor product={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />
    </>
  );
}

function ProductEditor({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => void }) {
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- reset gallery when another product opens
  useEffect(() => { const all = product?.images ?? []; setImages(all.filter((u) => !isVideoUrl(u))); setVideos(all.filter(isVideoUrl)); }, [product]);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!product) return;
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name")).trim();
    const row = {
      name, slug: product.slug || `${slugify(name)}-${Date.now().toString(36).slice(-4)}`,
      category: String(f.get("category")), tag: String(f.get("tag")).trim() || null,
      price_cents: centsFromCop(f.get("price")), inventory_count: Math.max(0, Number(f.get("inventory")) || 0),
      made_to_order: f.get("made_to_order") === "on", featured: f.get("featured") === "on", is_pet: f.get("is_pet") === "on", active: f.get("active") === "on",
      sort_order: Number(f.get("sort_order")) || 0, description: String(f.get("description")).trim() || null, details: String(f.get("details")).trim() || null,
      options: textToOptions(String(f.get("options"))), images: [...images, ...videos], image_url: images[0] ?? null,
    };
    setSaving(true);
    const query = product.id ? db().from("products").update(row).eq("id", product.id) : db().from("products").insert(row);
    const ok = await mutate(query, product.id ? "Producto actualizado" : "Producto publicado", ["products"]);
    setSaving(false);
    if (ok) onSaved();
  }

  return (
    <Drawer.Root direction="right" open={!!product} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="drawer-overlay" />
        <Drawer.Content className="cart-panel admin-editor" aria-describedby={undefined}>
          <Drawer.Title className="d cart-title">{product?.id ? "Editar producto" : "Nuevo producto"}</Drawer.Title>
          {product && (
            <form key={product.id || "new"} className="product-form" onSubmit={save}>
              <label>Fotos<ImageList value={images} onChange={setImages} folder="products" /></label>
              <label>Videos <span className="soft">(opcional: se ven en la ficha del producto y se reproducen solos, sin sonido)</span><VideoList value={videos} onChange={setVideos} folder="products" /></label>
              <label>Nombre<input name="name" required defaultValue={product.name} placeholder="Tote Pensamiento" /></label>
              <div className="form-pair">
                <label>Categoría<select name="category" defaultValue={product.category}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
                <label>Etiqueta en cursiva<input name="tag" defaultValue={product.tag ?? ""} placeholder="serigrafía, bordado, nuevo" /></label>
              </div>
              <div className="form-pair">
                <label>Precio (COP)<input name="price" inputMode="numeric" required defaultValue={product.id ? copFromCents(product.price_cents) : ""} placeholder="95000" /></label>
                <label>Inventario<input name="inventory" type="number" min="0" defaultValue={product.inventory_count} /></label>
              </div>
              <div className="checks">
                <label className="checkbox"><input name="made_to_order" type="checkbox" defaultChecked={product.made_to_order} /> Hecho por encargo</label>
                <label className="checkbox"><input name="featured" type="checkbox" defaultChecked={product.featured} /> Destacado</label>
                <label className="checkbox"><input name="is_pet" type="checkbox" defaultChecked={product.is_pet} /> Personalizado con mascota</label>
                <label className="checkbox"><input name="active" type="checkbox" defaultChecked={product.active} /> Visible en la tienda</label>
              </div>
              <label>Descripción<textarea name="description" rows={3} defaultValue={product.description ?? ""} placeholder="Cómo es la pieza y cómo se hace." /></label>
              <label>Detalles y medidas<textarea name="details" rows={2} defaultValue={product.details ?? ""} placeholder="Tela, forro, medidas…" /></label>
              <label>Opciones <span className="soft">una por línea · “Talla: S, M, L | nota opcional”</span><textarea name="options" rows={3} defaultValue={optionsToText(product.options)} placeholder={"Talla: S, M, L, XL\nModelo: Camiseta, Blusa esqueleto"} /></label>
              <label>Orden en la tienda<input name="sort_order" type="number" defaultValue={product.sort_order} /></label>
              <div className="editor-actions">
                <button className="button solid" type="submit" disabled={saving}>{saving ? "Guardando..." : product.id ? "Guardar cambios" : "Publicar producto"}</button>
                <Drawer.Close className="text-link" type="button">Cancelar</Drawer.Close>
              </div>
            </form>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
