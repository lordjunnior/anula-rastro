import { Button } from "@/components/ui/button";
import "./tool-palettes.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Lock, Download, ShieldCheck, ShieldAlert, Flame, Cpu, Trash2, MapPin } from "lucide-react";
import { analyzeBuffer, type ExifReport } from "@/lib/tools/exifParser";
import { stripBinary, rebuildViaCanvas, sha256, type RemovedBlock } from "@/lib/tools/metadataStripper";
import "./anula-rastro.css";
import { ToolGuide, usePlateReveal } from "@/components/tools/ToolGuide";
import { HamsterLoader } from "@/components/tools/HamsterLoader";

type Mode = "binario" | "reconstrucao";
interface Item {
  id: string; name: string; before: ExifReport; after: ExifReport; removed: RemovedBlock[];
  sizeIn: number; sizeOut: number; ms: number; hash: string; url: string; origUrl: string;
  headIn: Uint8Array; headOut: Uint8Array; outName: string; method: Mode;
}

/* Fundo vivo: fluxo de bytes descendo em canvas, cores lidas dos tokens. */
function ByteRain({ intensity }: { intensity: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const k = useRef(intensity);
  k.current = intensity;
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = c.getContext("2d"); if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gold = getComputedStyle(c).getPropertyValue("--primary").trim() || "38 72% 52%";
    let w = 0, h = 0, cols: number[] = [], raf = 0;
    const size = 14;
    const resize = () => {
      w = c.width = c.offsetWidth; h = c.height = c.offsetHeight;
      cols = Array.from({ length: Math.ceil(w / size) }, () => Math.random() * -h);
    };
    resize(); window.addEventListener("resize", resize);
    const draw = () => {
      ctx.fillStyle = "color-mix(in srgb, var(--background) 18%, transparent)"; ctx.fillRect(0, 0, w, h);
      ctx.font = `${size - 2}px ui-monospace, monospace`;
      cols.forEach((y, i) => {
        const hex = ((Math.random() * 256) | 0).toString(16).padStart(2, "0").toUpperCase();
        ctx.fillStyle = `color-mix(in srgb, ${gold} calc((${0.15 + Math.random() * 0.35 * k.current}) * 100%), transparent)`;
        ctx.fillText(hex, i * size, y);
        cols[i] = y > h + Math.random() * 4000 ? 0 : y + size * (0.35 + k.current * 0.9);
      });
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} aria-hidden className="ar-rain" />;
}

const hexRows = (b: Uint8Array) => {
  const rows: string[] = [];
  for (let i = 0; i < Math.min(b.length, 160); i += 16)
    rows.push(`${i.toString(16).padStart(4, "0")}  ${[...b.subarray(i, i + 16)].map((x) => x.toString(16).padStart(2, "0")).join(" ")}`);
  return rows;
};
const kb = (n: number) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`);

function Compare({ a, b }: { a: string; b: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="ar-compare" style={{ ["--pos" as string]: `${pos}%` }}>
      <img src={b} alt="Arquivo estéril" />
      <img src={a} alt="Arquivo original" className="ar-compare-top" />
      <span className="ar-tag left">Original</span><span className="ar-tag right">Estéril</span>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(+e.target.value)} aria-label="Comparar original e estéril" />
    </div>
  );
}

const AnulaRastro = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [mode, setMode] = useState<Mode>("binario");
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const push = (l: string) => setLog((x) => [...x.slice(-7), l]);

  const process = useCallback(async (files: FileList | File[]) => {
    setError(""); setBusy(true);
    for (const file of Array.from(files)) {
      try {
        const t0 = performance.now();
        const src = new Uint8Array(await file.arrayBuffer());
        push(`> ${file.name}: ${kb(src.length)} carregado na memória`);
        const before = analyzeBuffer(src.slice().buffer as ArrayBuffer);
        let out: Uint8Array; let removed: RemovedBlock[] = []; let method: Mode = mode; let ext = file.name.split(".").pop() || "bin";
        const bin = mode === "binario" ? stripBinary(src) : null;
        if (bin) { out = bin.bytes; removed = bin.removed; }
        else { out = await rebuildViaCanvas(file); method = "reconstrucao"; ext = "png"; removed = [{ name: "Cabeçalho completo (reconstruído)", offset: 0, size: Math.max(0, src.length - out.length) }]; }
        removed.forEach((r) => push(`  - removido ${r.name} @0x${r.offset.toString(16)} (${kb(r.size)})`));
        const after = analyzeBuffer(out.slice().buffer as ArrayBuffer);
        const hash = await sha256(out);
        const mime = ext === "png" ? "image/png" : file.type || "application/octet-stream";
        const url = URL.createObjectURL(new Blob([out as BlobPart], { type: mime }));
        const it: Item = {
          id: crypto.randomUUID(), name: file.name, before, after, removed, sizeIn: src.length, sizeOut: out.length,
          ms: performance.now() - t0, hash, url, origUrl: URL.createObjectURL(file), method,
          headIn: src.slice(0, 160), headOut: out.slice(0, 160), outName: `esteril-${hash.slice(0, 8)}.${ext}`,
        };
        push(`  ok SHA-256 ${hash.slice(0, 16)}... em ${it.ms.toFixed(0)} ms`);
        setItems((x) => [it, ...x]); setActive(it.id);
      } catch {
        setError(`Não foi possível esterilizar ${file.name}.`);
      }
    }
    setBusy(false);
  }, [mode]);

  const cur = items.find((i) => i.id === active);
  const totalRemoved = items.reduce((n, i) => n + (i.sizeIn - i.sizeOut), 0);
  const gpsKilled = items.filter((i) => i.before.gps && !i.after.gps).length;
  const keys = cur ? Array.from(new Set([...Object.keys(cur.before.tags), ...Object.keys(cur.after.tags)])) : [];

  const scope = usePlateReveal(".ar-plate");

  return (
    <div ref={scope} className="ar-root" data-tool="anula-rastro">
      <ByteRain intensity={busy ? 1 : 0.35} />
      <div className="ar-grid">
        <section className="ar-plate ar-intro">
          <p className="ar-kicker"><Flame className="w-3.5 h-3.5" /> Anula Rastro</p>
          <h2>Esterilizador local de metadados</h2>
          <p className="ar-muted">Solte fotos e receba cópias limpas: sem GPS, sem modelo do aparelho, sem números de série, sem datas nem software de edição.</p>
          <p className="ar-lock"><Lock className="w-3.5 h-3.5" /> Tudo acontece na memória do seu navegador. Nenhum byte é enviado.</p>
          <ToolGuide
            defaultOpen={false}
            purpose="Antes de publicar ou enviar uma foto, esta ferramenta gera uma cópia limpa, sem localização, modelo do aparelho, números de série e datas escondidos no arquivo. Ela não apaga o que aparece na imagem, como rostos, placas ou fachadas."
            steps={[
              { title: "Escolha o método", text: "Corte binário mantém a qualidade original e remove só os blocos de dados. Reconstrução total redesenha a imagem do zero: mais rigorosa, gera um PNG." },
              { title: "Solte as fotos", text: "Arraste uma ou várias imagens. A limpeza acontece na hora, no seu aparelho." },
              { title: "Confira e baixe", text: "Compare antes e depois, veja a tabela do que foi removido e baixe a cópia com nome anônimo." },
            ]}
          />
          <div className="ar-modes" role="radiogroup" aria-label="Método">
            {([["binario", "Corte binário", "Remove só os blocos de metadados. Pixels intactos, qualidade original."],
               ["reconstrucao", "Reconstrução total", "Redesenha os pixels em um arquivo novo PNG. Nenhum cabeçalho sobrevive."]] as const).map(([v, t, d]) => (
              <Button variant="unstyled" key={v} role="radio" aria-checked={mode === v} onClick={() => setMode(v)} className={mode === v ? "on" : ""}>
                <strong>{t}</strong><span>{d}</span>
              </Button>
            ))}
          </div>
          <Button variant="unstyled" type="button" className={`ar-drop ${drag ? "drag" : ""} ${busy ? "busy" : ""}`}
            onClick={() => input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); process(e.dataTransfer.files); }}>
            <span className="ar-scan" aria-hidden />
            {busy ? <HamsterLoader label="Esterilizando..." size={7} /> : <><Upload className="w-8 h-8" /><strong>Arraste fotos ou clique</strong></>}
            <span className="ar-muted text-xs">JPEG, PNG e WebP em corte binário. Outros formatos legíveis pelo navegador vão para reconstrução.</span>
          </Button>
          <input ref={input} type="file" multiple accept="image/*" className="hidden" aria-label="Escolher fotos" onChange={(e) => e.target.files && process(e.target.files)} />
          {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
        </section>

        <section className="ar-plate ar-stats" aria-live="polite">
          <div><span>{items.length}</span><small>arquivos esterilizados</small></div>
          <div><span>{kb(totalRemoved)}</span><small>de rastros eliminados</small></div>
          <div><span>{gpsKilled}</span><small>coordenadas GPS apagadas</small></div>
          <div><span>{cur ? `${cur.ms.toFixed(0)} ms` : "0 ms"}</span><small>último tempo de execução</small></div>
        </section>

        <section className="ar-plate ar-term" aria-label="Registro da operação">
          <p className="ar-kicker"><Cpu className="w-3.5 h-3.5" /> Telemetria</p>
          <pre>{log.length ? log.join("\n") : "> aguardando arquivo..."}<span className="ar-caret">_</span></pre>
        </section>

        {cur && (
          <>
            <section className="ar-plate ar-view">
              <Compare a={cur.origUrl} b={cur.url} />
              <div className="ar-actions">
                <div className="min-w-0">
                  <p className="font-mono text-xs truncate">{cur.outName}</p>
                  <p className="ar-muted text-xs font-mono break-all">SHA-256 {cur.hash}</p>
                </div>
                <a href={cur.url} download={cur.outName} className="ar-btn"><Download className="w-4 h-4" /> Baixar arquivo estéril</a>
              </div>
            </section>

            <section className="ar-plate ar-dossier">
              <div className={`ar-verdict ${cur.after.risk === "limpo" ? "ok" : "warn"}`}>
                {cur.after.risk === "limpo" ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                {cur.after.risk === "limpo" ? "Verificação pós-limpeza: nenhum EXIF, GPS ou XMP restante" : "Ainda há metadados: use Reconstrução total"}
              </div>
              {cur.before.gps && <p className="ar-gps"><MapPin className="w-4 h-4" /> GPS removido: {cur.before.gps.lat.toFixed(5)}, {cur.before.gps.lon.toFixed(5)}</p>}
              <table>
                <thead><tr><th>Campo</th><th>Antes</th><th>Depois</th></tr></thead>
                <tbody>
                  {keys.length ? keys.map((k) => (
                    <tr key={k}><td>{k}</td><td className="bad">{String(cur.before.tags[k] ?? "-")}</td><td className="good">{cur.after.tags[k] !== undefined ? String(cur.after.tags[k]) : "removido"}</td></tr>
                  )) : <tr><td colSpan={3} className="ar-muted">O original já não tinha campos EXIF legíveis.</td></tr>}
                </tbody>
              </table>
              <ul className="ar-blocks">
                {cur.removed.map((r, i) => <li key={i}><Trash2 className="w-3.5 h-3.5" />{r.name}<span>{kb(r.size)}</span></li>)}
                {!cur.removed.length && <li className="ar-muted">Nenhum bloco de metadados encontrado.</li>}
              </ul>
            </section>

            <section className="ar-plate ar-hex">
              <div><p className="ar-kicker">Cabeçalho original</p><pre>{hexRows(cur.headIn).join("\n")}</pre></div>
              <div><p className="ar-kicker">Cabeçalho estéril</p><pre>{hexRows(cur.headOut).join("\n")}</pre></div>
            </section>
          </>
        )}

        {items.length > 1 && (
          <section className="ar-plate ar-queue" aria-label="Fila de arquivos">
            {items.map((i) => (
              <Button variant="unstyled" key={i.id} onClick={() => setActive(i.id)} className={i.id === active ? "on" : ""}>
                <img src={i.url} alt="" /><span className="truncate">{i.name}</span><small>-{kb(i.sizeIn - i.sizeOut)}</small>
              </Button>
            ))}
          </section>
        )}

        <p className="ar-plate ar-note ar-muted text-xs">
          Limites: a limpeza remove metadados do arquivo, não marcas visíveis na imagem (rostos, placas, reflexos, fachadas). O corte binário também remove o perfil de cor ICC, o que pode alterar levemente as cores. HEIC e vídeos não são tratados.
        </p>
      </div>
    </div>
  );
};

export default AnulaRastro;
