// Leitor EXIF local: roda inteiramente no navegador, sem dependências externas.
export type ExifValue = string | number | number[];
export interface ExifReport {
  format: string;
  tags: Record<string, ExifValue>;
  gps?: { lat: number; lon: number; alt?: number | undefined } | undefined;
  hasXmp: boolean;
  risk: "critico" | "atencao" | "limpo";
}

const TAGS: Record<number, string> = {
  0x010f: "Fabricante", 0x0110: "Modelo", 0x0131: "Software", 0x0132: "Data de modificação",
  0x013b: "Autor", 0x8298: "Copyright", 0x9003: "Data original", 0x9004: "Data de digitalização",
  0xa431: "Número de série do corpo", 0xa435: "Número de série da lente", 0xa434: "Modelo da lente",
  0xa433: "Fabricante da lente", 0x829a: "Exposição", 0x829d: "Abertura (f)", 0x8827: "ISO",
  0x920a: "Distância focal", 0xa002: "Largura", 0xa003: "Altura", 0x0112: "Orientação",
  0xa420: "ID único da imagem", 0xc62f: "Número de série", 0x9010: "Fuso horário",
};
const GPS_TAGS: Record<number, string> = { 1: "LatRef", 2: "Lat", 3: "LonRef", 4: "Lon", 5: "AltRef", 6: "Alt" };
const SIZES: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

function readIfd(v: DataView, tiff: number, off: number, le: boolean, map: Record<number, string>, out: Record<string, ExifValue>, ptrs: Record<string, number>) {
  if (tiff + off + 2 > v.byteLength) return;
  const n = v.getUint16(tiff + off, le);
  for (let i = 0; i < n; i++) {
    const e = tiff + off + 2 + i * 12;
    if (e + 12 > v.byteLength) return;
    const tag = v.getUint16(e, le), type = v.getUint16(e + 2, le), count = v.getUint32(e + 4, le);
    if (tag === 0x8769) { ptrs["exif"] = v.getUint32(e + 8, le); continue; }
    if (tag === 0x8825) { ptrs["gps"] = v.getUint32(e + 8, le); continue; }
    const name = map[tag];
    if (!name) continue;
    const size = (SIZES[type] || 1) * count;
    const p = size > 4 ? tiff + v.getUint32(e + 8, le) : e + 8;
    if (p + size > v.byteLength) continue;
    let val: ExifValue;
    if (type === 2) {
      let s = "";
      for (let k = 0; k < count; k++) { const c = v.getUint8(p + k); if (c) s += String.fromCharCode(c); }
      val = s.trim();
    } else if (type === 5 || type === 10) {
      const arr: number[] = [];
      for (let k = 0; k < count; k++) {
        const a = type === 5 ? v.getUint32(p + k * 8, le) : v.getInt32(p + k * 8, le);
        const b = type === 5 ? v.getUint32(p + k * 8 + 4, le) : v.getInt32(p + k * 8 + 4, le);
        arr.push(b ? a / b : 0);
      }
      val = arr.length === 1 ? (arr[0] ?? 0) : arr;
    } else if (type === 3) {
      const arr: number[] = [];
      for (let k = 0; k < count; k++) arr.push(v.getUint16(p + k * 2, le));
      val = arr.length === 1 ? (arr[0] ?? 0) : arr;
    } else if (type === 4 || type === 9) {
      val = type === 4 ? v.getUint32(p, le) : v.getInt32(p, le);
    } else {
      val = count === 1 ? v.getUint8(p) : String.fromCharCode(v.getUint8(p));
    }
    if (val !== "") out[name] = val;
  }
}

export function parseTiff(v: DataView, tiff: number): Record<string, ExifValue> {
  const le = v.getUint16(tiff) === 0x4949;
  if (v.getUint16(tiff + 2, le) !== 42) return {};
  const out: Record<string, ExifValue> = {}, ptrs: Record<string, number> = {};
  readIfd(v, tiff, v.getUint32(tiff + 4, le), le, TAGS, out, ptrs);
  if (ptrs["exif"]) readIfd(v, tiff, ptrs["exif"], le, TAGS, out, ptrs);
  if (ptrs["gps"]) readIfd(v, tiff, ptrs["gps"], le, GPS_TAGS, out, ptrs);
  return out;
}

const dms = (x: ExifValue | undefined) => Array.isArray(x) ? (x[0] ?? 0) + (x[1] || 0) / 60 + (x[2] || 0) / 3600 : undefined;

function findExif(buf: ArrayBuffer): { format: string; tags: Record<string, ExifValue> } {
  const v = new DataView(buf);
  const ascii = (o: number, n: number) => { let s = ""; for (let i = 0; i < n && o + i < v.byteLength; i++) s += String.fromCharCode(v.getUint8(o + i)); return s; };
  if (v.byteLength < 12) return { format: "desconhecido", tags: {} };
  if (v.getUint16(0) === 0xffd8) {
    let o = 2;
    while (o + 4 < v.byteLength) {
      if (v.getUint8(o) !== 0xff) break;
      const marker = v.getUint8(o + 1), len = v.getUint16(o + 2);
      if (marker === 0xe1 && ascii(o + 4, 4) === "Exif") return { format: "JPEG", tags: parseTiff(v, o + 10) };
      if (marker === 0xda) break;
      o += 2 + len;
    }
    return { format: "JPEG", tags: {} };
  }
  if (v.getUint16(0) === 0x4949 || v.getUint16(0) === 0x4d4d) return { format: "TIFF/RAW", tags: parseTiff(v, 0) };
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    let o = 12;
    while (o + 8 < v.byteLength) {
      const id = ascii(o, 4), len = v.getUint32(o + 4, true);
      if (id === "EXIF") { const s = ascii(o + 8, 4) === "Exif" ? o + 14 : o + 8; return { format: "WebP", tags: parseTiff(v, s) }; }
      o += 8 + len + (len % 2);
    }
    return { format: "WebP", tags: {} };
  }
  if (v.getUint32(0) === 0x89504e47) {
    let o = 8;
    while (o + 8 < v.byteLength) {
      const len = v.getUint32(o), id = ascii(o + 4, 4);
      if (id === "eXIf") return { format: "PNG", tags: parseTiff(v, o + 8) };
      o += 12 + len;
    }
    return { format: "PNG", tags: {} };
  }
  return { format: "desconhecido", tags: {} };
}

export function analyzeBuffer(buf: ArrayBuffer): ExifReport {
  const { format, tags } = findExif(buf);
  const head = new TextDecoder("latin1").decode(new Uint8Array(buf, 0, Math.min(buf.byteLength, 512 * 1024)));
  const hasXmp = head.includes("x:xmpmeta") || head.includes("http://ns.adobe.com/xap/");
  let gps: ExifReport["gps"];
  const lat = dms(tags["Lat"]), lon = dms(tags["Lon"]);
  if (lat !== undefined && lon !== undefined && !(lat === 0 && lon === 0)) {
    gps = {
      lat: tags["LatRef"] === "S" ? -lat : lat,
      lon: tags["LonRef"] === "W" ? -lon : lon,
      alt: typeof tags["Alt"] === "number" ? (tags["AltRef"] === 1 ? -tags["Alt"] : tags["Alt"]) : undefined,
    };
  }
  for (const k of ["Lat", "Lon", "LatRef", "LonRef", "Alt", "AltRef"]) delete tags[k];
  const identifying = ["Número de série", "Número de série do corpo", "Número de série da lente", "ID único da imagem", "Autor"];
  const risk: ExifReport["risk"] = gps || identifying.some((k) => tags[k])
    ? "critico"
    : Object.keys(tags).length || hasXmp ? "atencao" : "limpo";
  return { format, tags, gps, hasXmp, risk };
}
