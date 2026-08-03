export type PdfCell = string | number | null | undefined;

interface PdfReportOptions {
  title: string;
  filename: string;
  columns: string[];
  rows: PdfCell[][];
}

const escapePdfText = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\x20-\x7E]/g, ' ')
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)');

const wrapLine = (line: string, width = 105) => {
  const words = line.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) lines.push(current);
  return lines.length ? lines : [''];
};

/** Creates a compact, dependency-free PDF and immediately downloads it. */
export function downloadReportPdf({ title, filename, columns, rows }: PdfReportOptions) {
  const generatedAt = new Date().toLocaleString();
  const reportLines = [
    title,
    `Generated: ${generatedAt}`,
    `Records: ${rows.length}`,
    '',
    columns.join(' | '),
    '-'.repeat(110),
    ...(rows.length
      ? rows.flatMap((row) => wrapLine(row.map((cell) => String(cell ?? 'N/A')).join(' | ')))
      : ['No records match the current filters.']),
  ];

  const pageLineCapacity = 48;
  const pages: string[][] = [];
  for (let index = 0; index < reportLines.length; index += pageLineCapacity) {
    pages.push(reportLines.slice(index, index + pageLineCapacity));
  }

  const objects: string[] = [];
  const pageObjectNumbers = pages.map((_, index) => 4 + index * 2);
  const contentObjectNumbers = pages.map((_, index) => 5 + index * 2);
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

  pages.forEach((lines, index) => {
    const pageId = pageObjectNumbers[index];
    const contentId = contentObjectNumbers[index];
    const streamLines = lines.map((line, lineIndex) => {
      const fontSize = lineIndex === 0 ? 16 : lineIndex === 1 ? 10 : 9;
      const y = 790 - lineIndex * 15;
      return `BT /F1 ${fontSize} Tf 48 ${y} Td (${escapePdfText(line)}) Tj ET`;
    });
    const stream = streamLines.join('\n');
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = new TextEncoder().encode(pdf).length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
