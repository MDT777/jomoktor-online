import { PDFDocument, rgb } from "npm:pdf-lib@1.17.1";
import fontkit from "npm:@pdf-lib/fontkit@1.1.1";

const FONT_REG = "https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf";
const FONT_BOLD = "https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans-Bold.ttf";

async function fetchBytes(url: string): Promise<Uint8Array> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch ${url}: ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}

export async function buildPdf(opts: {
  title: string;
  story: string;
  images?: string[];
  childName?: string;
  language?: string;
}): Promise<Uint8Array> {
  const { title, story, images = [], childName = "", language = "ru" } = opts;

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const [regB, boldB] = await Promise.all([fetchBytes(FONT_REG), fetchBytes(FONT_BOLD)]);
  const reg = await pdf.embedFont(regB, { subset: true });
  const bold = await pdf.embedFont(boldB, { subset: true });

  const PW = 595.28, PH = 841.89, M = 50;
  const contentW = PW - 2 * M;
  const cream = rgb(1, 0.98, 0.945);
  const ink = rgb(0.227, 0.196, 0.173);
  const inkSoft = rgb(0.48, 0.435, 0.392);
  const brand = rgb(0.91, 0.365, 0.165);

  const embedded: any[] = [];
  for (const url of images) {
    try {
      const b = await fetchBytes(url);
      const img = (b[0] === 0x89 && b[1] === 0x50)
        ? await pdf.embedPng(b)
        : await pdf.embedJpg(b);
      embedded.push(img);
    } catch (e) {
      console.error("img embed failed:", String(e));
    }
  }

  const newPage = () => {
    const p = pdf.addPage([PW, PH]);
    p.drawRectangle({ x: 0, y: 0, width: PW, height: PH, color: cream });
    return p;
  };

  const wrap = (text: string, font: any, size: number, maxW: number): string[] => {
    const out: string[] = [];
    for (const raw of text.split("\n")) {
      const words = raw.split(/\s+/).filter(Boolean);
      let cur = "";
      for (const w of words) {
        const t = cur ? cur + " " + w : w;
        if (font.widthOfTextAtSize(t, size) > maxW && cur) { out.push(cur); cur = w; }
        else cur = t;
      }
      out.push(cur);
    }
    return out;
  };

  const drawImageFit = (page: any, img: any, x: number, yTop: number, boxW: number, boxH: number): number => {
    const iw = img.width, ih = img.height;
    const s = Math.min(boxW / iw, boxH / ih);
    const w = iw * s, h = ih * s;
    page.drawImage(img, { x: x + (boxW - w) / 2, y: yTop - h, width: w, height: h });
    return h;
  };

  const cover = newPage();
  let y = PH - M;
  if (embedded[0]) {
    const h = drawImageFit(cover, embedded[0], M, PH - M, contentW, 430);
    y = PH - M - h - 34;
  } else {
    y = PH - 210;
  }
  const titleSize = 26;
  for (const ln of wrap(title, bold, titleSize, contentW)) {
    const w = bold.widthOfTextAtSize(ln, titleSize);
    cover.drawText(ln, { x: (PW - w) / 2, y: y - titleSize, size: titleSize, font: bold, color: ink });
    y -= titleSize + 6;
  }
  if (childName) {
    const sub = language === "ky"
      ? `${childName} үчүн жомок`
      : `Сказка для ${childName}`;
    const ss = 14;
    const w = reg.widthOfTextAtSize(sub, ss);
    cover.drawText(sub, { x: (PW - w) / 2, y: y - ss - 8, size: ss, font: reg, color: inkSoft });
  }
  {
    const bt = "jomoktor.online", bs = 12;
    const w = reg.widthOfTextAtSize(bt, bs);
    cover.drawText(bt, { x: (PW - w) / 2, y: M, size: bs, font: reg, color: brand });
  }

  const bodyImgs = embedded.slice(1);
  const paras = story.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
  const bodySize = 12.5, lineH = 18, parGap = 9;
  const nSec = Math.max(1, bodyImgs.length);
  const sections: string[][] = Array.from({ length: nSec }, () => []);
  paras.forEach((p, i) => sections[Math.min(nSec - 1, Math.floor((i * nSec) / paras.length))].push(p));

  let page: any = null, cy = 0;
  const ensure = (space: number) => {
    if (!page || cy - space < M) { page = newPage(); cy = PH - M; }
  };
  const drawParas = (list: string[]) => {
    for (const p of list) {
      for (const ln of wrap(p, reg, bodySize, contentW)) {
        ensure(lineH);
        page.drawText(ln, { x: M, y: cy - bodySize, size: bodySize, font: reg, color: ink });
        cy -= lineH;
      }
      cy -= parGap;
    }
  };

  for (let s = 0; s < nSec; s++) {
    page = newPage();
    cy = PH - M;
    if (bodyImgs[s]) {
      const h = drawImageFit(page, bodyImgs[s], M, cy, contentW, 300);
      cy -= h + 26;
    }
    drawParas(sections[s]);
  }

  return await pdf.save();
}
