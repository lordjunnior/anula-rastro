// Esterilizador binário local: remove blocos de metadados sem recodificar pixels.
export interface RemovedBlock { name: string; offset: number; size: number }
export interface StripResult { bytes: Uint8Array; format: string; removed: RemovedBlock[]; method: "binario" | "reconstrucao" }

const JPEG_DROP = new Set([0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xeb, 0xec, 0xed, 0xef, 0xfe]);
const JPEG_NAMES: Record<number, string> = { 0xe1: "APP1 (EXIF/GPS/XMP)", 0xe2: "APP2 (ICC/FlashPix)", 0xed: "APP13 (IPTC/Photoshop)", 0xfe: "COM (comentário)" };
const PNG_DROP = new Set(["tEXt", "zTXt", "iTXt", "eXIf", "tIME"]);

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

export function stripJpeg(b: Uint8Array): StripResult {
  if (b[0] !== 0xff || b[1] !== 0xd8) throw new Error("JPEG inválido");
  const parts: Uint8Array[] = [b.subarray(0, 2)];
  const removed: RemovedBlock[] = [];
  let i = 2;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) throw new Error("Marcador corrompido");
    const m = b[i + 1];
    if (m === undefined) throw new Error("Marcador corrompido");
    if (m === 0xda) { parts.push(b.subarray(i)); break; }
    if (m === 0xd9) { parts.push(b.subarray(i, i + 2)); break; }
    const len = ((b[i + 2] ?? 0) << 8) | (b[i + 3] ?? 0);
    const seg = b.subarray(i, i + 2 + len);
    if (JPEG_DROP.has(m)) removed.push({ name: JPEG_NAMES[m] ?? `APP${m - 0xe0}`, offset: i, size: seg.length });
    else parts.push(seg);
    i += 2 + len;
  }
  return { bytes: concat(parts), format: "JPEG", removed, method: "binario" };
}

export function stripPng(b: Uint8Array): StripResult {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const parts: Uint8Array[] = [b.subarray(0, 8)];
  const removed: RemovedBlock[] = [];
  let i = 8;
  while (i + 12 <= b.length) {
    const len = v.getUint32(i);
    const type = String.fromCharCode(...b.subarray(i + 4, i + 8));
    const chunk = b.subarray(i, i + 12 + len);
    if (PNG_DROP.has(type)) removed.push({ name: `${type} (texto/EXIF/data)`, offset: i, size: chunk.length });
    else parts.push(chunk);
    i += 12 + len;
    if (type === "IEND") break;
  }
  return { bytes: concat(parts), format: "PNG", removed, method: "binario" };
}

export function stripWebp(b: Uint8Array): StripResult {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const parts: Uint8Array[] = [];
  const removed: RemovedBlock[] = [];
  let i = 12;
  while (i + 8 <= b.length) {
    const type = String.fromCharCode(...b.subarray(i, i + 4));
    const len = v.getUint32(i + 4, true);
    const chunk = b.slice(i, i + 8 + len + (len & 1));
    if (type === "EXIF" || type === "XMP ") removed.push({ name: `${type.trim()} (metadados)`, offset: i, size: chunk.length });
    else {
      if (type === "VP8X") chunk[8] = (chunk[8] ?? 0) & ~0x0c; // limpa flags EXIF e XMP
      parts.push(chunk);
    }
    i += 8 + len + (len & 1);
  }
  const body = concat(parts);
  const head = new Uint8Array(12);
  head.set(b.subarray(0, 12));
  new DataView(head.buffer).setUint32(4, body.length + 4, true);
  return { bytes: concat([head, body]), format: "WebP", removed, method: "binario" };
}

export function detectFormat(b: Uint8Array): "jpeg" | "png" | "webp" | null {
  if (b[0] === 0xff && b[1] === 0xd8) return "jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 && b[9] === 0x45) return "webp";
  return null;
}

export function stripBinary(b: Uint8Array): StripResult | null {
  const f = detectFormat(b);
  if (f === "jpeg") return stripJpeg(b);
  if (f === "png") return stripPng(b);
  if (f === "webp") return stripWebp(b);
  return null;
}

/** Reconstrução por pixels: nenhum cabeçalho original sobrevive. */
export async function rebuildViaCanvas(file: Blob, type = "image/png"): Promise<Uint8Array> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
  const c = document.createElement("canvas");
  c.width = bmp.width; c.height = bmp.height;
  const context = c.getContext("2d");
  if (!context) { bmp.close(); throw new Error("Canvas indisponível"); }
  context.drawImage(bmp, 0, 0);
  bmp.close();
  const blob: Blob = await new Promise((r, j) => c.toBlob((x) => (x ? r(x) : j(new Error("falha"))), type, 0.95));
  return new Uint8Array(await blob.arrayBuffer());
}

export async function sha256(bytes: Uint8Array): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
