import { Mushroom, Star } from "./icons";

const ORDER = [0, 3, 2, 5, 4, 1, 6, 3, 0, 2, 6, 1, 4, 5];
const GAPS = [6, 4, 8, 3, 6, 9, 5, 7, 4, 8, 5, 6, 7, 6];

/** Honguitos que se mecen, en una cinta que corre despacio. */
export function MushBand() {
  const set = [...ORDER, ...ORDER, ...ORDER];
  return (
    <div className="mushband" aria-hidden>
      <div className="mrun">
        {[0, 1].map((s) => (
          <div className="mset" key={s}>
            {set.map((t, i) => <span className="mu" key={i} style={{ animationDelay: `${(-(i * 0.47) % 3.6).toFixed(2)}s`, marginRight: GAPS[i % GAPS.length] * 4 }}><Mushroom type={t} /></span>)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Marquee({ phrases }: { phrases: [string, boolean][] }) {
  const items = Array.from({ length: 6 }, () => phrases).flat();
  return (
    <div className="marquee" aria-hidden>
      <div className="mtrack">
        {items.map(([text, italic], i) => <span key={i} className="mitem"><span className={`d${italic ? " it" : ""}`}>{text}</span><Star size={16} /></span>)}
      </div>
    </div>
  );
}

/** Encaje de enredadera, de lado a lado. Nunca alrededor de las fotos. */
export function Lace({ tone = "cream" }: { tone?: "cream" | "wine" | "olive" | "pink" }) {
  return <div className={`lace lace-${tone}`} aria-hidden />;
}

/** Banda vinotinto de pensamientos: arriba y abajo de la portada y sobre el footer. */
export function PansyBand({ reverse, olive }: { reverse?: boolean; olive?: boolean }) {
  return <div className={`pband${reverse ? " rev" : ""}${olive ? " olive" : ""}`} aria-hidden />;
}
