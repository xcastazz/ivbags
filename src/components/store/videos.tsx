"use client";

import { useEffect, useRef, useState } from "react";
import type { SiteContent, StoreVideo } from "@/lib/types";
import { waLink } from "@/lib/format";
import { Star } from "./icons";

/** Videos del taller: se reproducen solos (sin sonido) al llegar a la sección; al lado, quiénes somos y redes. */
export function VideoSection({ videos, c }: { videos: StoreVideo[]; c: SiteContent }) {
  const [idx, setIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const ref = useRef<HTMLVideoElement>(null);
  const video = videos[idx];

  // Reproduce cuando al menos la mitad del video está en pantalla; pausa al salir.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !reduce) el.play().catch(() => {});
      else el.pause();
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [idx]);

  if (!video) return null;
  const ig = `https://instagram.com/${c.instagram}`;

  return (
    <section id="videos" className="section-videos" aria-labelledby="videos-title">
      <div className="videos-inner">
        <div className="video-stage">
          <div className="video-frame">
            <video
              key={video.id}
              ref={ref}
              src={video.video_url}
              poster={video.poster_url ?? undefined}
              muted={muted}
              loop={videos.length === 1}
              playsInline
              preload="metadata"
              onEnded={() => setIdx((i) => (i + 1) % videos.length)}
              aria-label={video.title}
            />
            <button className="video-sound" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Activar sonido" : "Silenciar"}>
              {muted
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M11 5 6 9H2v6h4l5 4zM23 9l-6 6M17 9l6 6" /></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></svg>}
            </button>
          </div>
          {videos.length > 1 && (
            <div className="video-thumbs" role="tablist" aria-label="Más videos">
              {videos.map((v, i) => (
                <button key={v.id} role="tab" aria-selected={i === idx} className={i === idx ? "on" : ""} onClick={() => setIdx(i)}>
                  {v.poster_url ? <img src={v.poster_url} alt="" /> : <video src={`${v.video_url}#t=0.5`} muted preload="metadata" />}
                  <span>{v.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="video-info">
          <div className="lb pink-lb"><Star size={11} /> Desde el taller <Star size={11} /></div>
          <h2 id="videos-title" className="d h-videos">{video.title}</h2>
          {video.caption && <p className="video-caption">{video.caption}</p>}
          <p>Cada pieza la pintamos y bordamos a mano en {c.city.split(",")[0]}. Aquí te mostramos cómo nacen, paso a paso.</p>
          <ul className="video-facts">
            <li><strong>Hecho a mano</strong><span>Pintura textil y bordado, pieza por pieza.</span></li>
            <li><strong>Envíos a toda Colombia</strong><span>Listo para enviar al día hábil siguiente.</span></li>
            <li><strong>Personalizados</strong><span>Tu idea, tu mascota o tu nombre.</span></li>
          </ul>
          <div className="video-links">
            <a className="btn btn-solid" href={ig} target="_blank" rel="noopener">Síguenos @{c.instagram}</a>
            <a className="btn btn-line" href={waLink(c.whatsapp, "Hola, vi sus videos y quiero saber más.")} target="_blank" rel="noopener">Escríbenos</a>
          </div>
        </div>
      </div>
    </section>
  );
}
