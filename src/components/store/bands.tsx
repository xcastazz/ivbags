import { Star } from "./icons";

const ORDER = [1, 4, 3, 6, 5, 2, 7, 4, 1, 3, 7, 2, 5, 6];
const GAPS = [6, 4, 8, 3, 6, 9, 5, 7, 4, 8, 5, 6, 7, 6];
const HONGO = (n: number) => `/kit/ilustraciones/honguitos/hongo-${n}.svg`;

/** Fila de honguitos del kit: avanzan despacio y cada uno se mece. */
export function MushBand() {
  const set = [...ORDER, ...ORDER, ...ORDER];
  return (
    <div className="mushband" aria-hidden>
      <div className="mrun">
        {[0, 1].map((s) => (
          <div className="mset" key={s}>
            {set.map((n, i) => <img className="mu" key={i} src={HONGO(n)} alt="" style={{ height: 48, width: "auto", animationDelay: `${(-(i * 0.47) % 3.6).toFixed(2)}s`, marginRight: GAPS[i % GAPS.length] }} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Cinta rosa en movimiento. Se pausa al pasar el mouse. */
export function Marquee({ phrases = [["Forradas, con bolsillo y cierre", true], ["hechas a mano", false]] }: { phrases?: [string, boolean][] }) {
  const items = Array.from({ length: 6 }, () => phrases).flat();
  return (
    <div className="marquee ribbon">
      <div className="mtrack" aria-hidden>
        {items.map(([text, italic], i) => <span key={i} className="contents"><span className="d" style={{ fontSize: 23, fontStyle: italic ? "italic" : "normal" }}>{text}</span><Star className="mstar" size={16} /></span>)}
      </div>
    </div>
  );
}

/** Encaje del kit: crema (Hablemos), oliva (ficha de producto) o rosa (bolsa). */
export function Lace({ tone = "cream" }: { tone?: "cream" | "olive" | "pink" }) {
  return <div className={tone === "cream" ? "lace" : `lace-${tone}`} aria-hidden />;
}

/** Franja de pensamientos: vinotinto en la portada, Deep Olive sobre el footer. */
export function PansyBand({ reverse, olive }: { reverse?: boolean; olive?: boolean }) {
  return <div className={`pband${reverse ? " rev" : ""}${olive ? " olive" : ""}`} aria-hidden />;
}
