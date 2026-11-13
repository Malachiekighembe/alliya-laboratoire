/**
 * Générateur de PDF minimaliste (sans dépendance) : texte Helvetica/WinAnsi,
 * format A4, saut de page automatique. Suffisant pour les rapports de laboratoire.
 */

const PAGE_WIDTH = 595.28; // A4 en points
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const LINE_HEIGHT = 14;

const escapePdf = (text: string): string =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    // WinAnsi : les caractères hors ASCII deviennent des équivalents lisibles
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[^\x20-\x7E]/g, '?');

const wrap = (text: string, maxChars: number): string[] => {
  if (!text) return [''];
  const words = String(text).split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (!current.length) {
      current = word;
    } else if (`${current} ${word}`.length <= maxChars) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current.length) lines.push(current);
  return lines;
};

export interface PdfBlock {
  text: string;
  size?: number;
  bold?: boolean;
  gapBefore?: number;
}

export function generatePdf(title: string, blocks: PdfBlock[]): Buffer {
  const pages: string[] = [];
  let commands: string[] = [];
  let y = PAGE_HEIGHT - MARGIN;

  const newPage = () => {
    pages.push(commands.join('\n'));
    commands = [];
    y = PAGE_HEIGHT - MARGIN;
  };

  // Titre
  commands.push('BT', '/F2 16 Tf', `1 0 0 1 ${MARGIN} ${y} Tm`, `(${escapePdf(title)}) Tj`, 'ET');
  y -= LINE_HEIGHT * 1.6;

  for (const block of blocks) {
    const size = block.size ?? 10;
    const font = block.bold ? 'F2' : 'F1';
    if (block.gapBefore) y -= block.gapBefore;

    const maxChars = Math.floor((PAGE_WIDTH - MARGIN * 2) / (size * 0.5));
    for (const line of wrap(block.text, maxChars)) {
      if (y < MARGIN + LINE_HEIGHT) newPage();
      commands.push(
        'BT',
        `/${font} ${size} Tf`,
        `1 0 0 1 ${MARGIN} ${y} Tm`,
        `(${escapePdf(line)}) Tj`,
        'ET',
      );
      y -= LINE_HEIGHT;
    }
  }
  pages.push(commands.join('\n'));

  // Numérotation
  const pageContent = pages.map((content, index) => {
    const footerY = MARGIN / 2;
    return `${content}\nBT\n/F1 8 Tf\n1 0 0 1 ${MARGIN} ${footerY} Tm\n(Page ${index + 1}/${pages.length}) Tj\nET`;
  });

  const objects: string[] = [];
  // Objets 1..4 réservés : catalogue, pages, police normale, police gras.
  const pageObjectIds = pageContent.map((_, index) => 5 + index * 2);

  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push(
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageContent.length} >>`,
  );
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

  pageContent.forEach((content, index) => {
    const contentId = pageObjectIds[index] + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    objects.push(`<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`);
  });

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'latin1');
}