import type { Metadata } from "next";
import { getWeeklyFavorites } from "@/lib/data";
import { ProductCard } from "@/components/store/shop";
import { Marquee } from "@/components/store/bands";
import { BackHome } from "@/components/store/sections";
import { Star } from "@/components/store/icons";

export const metadata: Metadata = { title: "Favoritos de la semana | IV Bags", description: "Las piezas más vistas, guardadas y compradas en los últimos 7 días." };

/** Todas las piezas ordenadas por el ranking de los últimos 7 días. */
export default async function WeeklyFavoritesPage() {
  const { ranked, stats, hasActivity } = await getWeeklyFavorites();
  return (
    <>
      <BackHome />
      <section className="section-shop" id="productos">
        <div className="shop-head">
          <Star size={28} className="twinkle" />
          <div className="lb pink-lb">Lo que más se está queriendo</div>
          <h1 className="d h-shop">Favoritos de la semana</h1>
          <p className="weekly-note">{hasActivity ? "Ordenadas según lo que más se vio, se guardó, se agregó a la bolsa y se compró en los últimos 7 días." : "Esta semana apenas empieza. Muy pronto verás aquí las piezas más queridas."}</p>
        </div>
        <div className="pgrid">
          {ranked.map((p, i) => {
            const s = stats.get(p.id);
            return (
              <div className="weekly-item" key={p.id}>
                {s && <span className="weekly-rank d" aria-label={`Puesto ${i + 1}`}>#{i + 1}</span>}
                <ProductCard p={p} index={i} />
                {s && <p className="weekly-stats">{[s.views && `${s.views} ${s.views === 1 ? "vista" : "vistas"}`, s.purchases && `${s.purchases} ${s.purchases === 1 ? "vendida" : "vendidas"}`].filter(Boolean).join(" · ") || "En tendencia"}</p>}
              </div>
            );
          })}
        </div>
      </section>
      <Marquee />
    </>
  );
}
