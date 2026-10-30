import { jsPDF } from "jspdf/dist/jspdf.es.min.js";
import type { DecisionLetter } from "./decision-letter";

// Only the displayed letter model is accepted here, never a raw request or decision response.
export function buildDecisionLetterPdf(letter: DecisionLetter): jsPDF {
  const doc = new jsPDF({
    orientation: (letter.table?.headers.length ?? 0) > 6 ? "landscape" : "portrait",
  });
  const margin = 20;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const bottom = doc.internal.pageSize.getHeight() - margin;
  const lineHeight = 5.5;
  let y = margin;
  doc.setProperties({ title: `Decision letter ${letter.reference}`, author: letter.issuer });
  doc.setFontSize(11);
  doc.setTextColor(25);

  function ensure(height: number) {
    if (y + height > bottom) {
      doc.addPage();
      y = margin;
    }
  }

  function paragraph(text: string, bold = false, applies: string | null = null) {
    const start = applies ? text.indexOf(applies) : -1;
    const end = start >= 0 ? start + applies!.length : -1;
    const boldAt = (index: number) => bold || (start >= 0 && index >= start && index < end);
    // Measure with the actual font for each character, then wrap at word boundaries.
    let offset = 0;
    while (offset < text.length) {
      let limit = offset;
      let measured = 0;
      let lastSpace = -1;
      while (limit < text.length && text[limit] !== "\n") {
        doc.setFont("helvetica", boldAt(limit) ? "bold" : "normal");
        const next = doc.getTextWidth(text[limit]!);
        if (measured + next > width && limit > offset) break;
        measured += next;
        if (text[limit] === " ") lastSpace = limit;
        limit++;
      }
      if (limit < text.length && text[limit] !== "\n" && lastSpace > offset) limit = lastSpace;
      ensure(lineHeight);
      let x = margin;
      let run = offset;
      while (run < limit) {
        const isBold = boldAt(run);
        let runEnd = run + 1;
        while (runEnd < limit && boldAt(runEnd) === isBold) runEnd++;
        const part = text.slice(run, runEnd);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.text(part, x, y);
        x += doc.getTextWidth(part);
        run = runEnd;
      }
      y += lineHeight;
      offset = limit;
      if (text[offset] === "\n" || text[offset] === " ") offset++;
    }
    y += 2;
  }

  function heading(text: string) {
    ensure(lineHeight * 3);
    y += 3;
    paragraph(text, true);
  }

  paragraph(letter.issuer, true);
  paragraph(`Reference: ${letter.reference}`);
  paragraph(`Date: ${letter.date}`);
  heading("Decision letter");
  heading("Verdict");
  paragraph(letter.verdict);
  paragraph(letter.decision, true);
  heading("Why");
  paragraph(letter.rule);
  letter.triggers.forEach((phrase) => paragraph(`“${phrase}”`));
  heading("Legal basis");
  if (!letter.articles.length) paragraph(letter.legalFallback);
  for (const article of letter.articles) {
    paragraph(`${article.ref} · ${article.title}`, true);
    paragraph(article.quote, false, article.applies);
    if (article.summary) paragraph(article.summary);
  }
  heading("What we counted");
  paragraph(letter.plan);
  heading("Results");
  if (letter.table) {
    const cellWidth = width / letter.table.headers.length;
    function tableRow(cells: string[], header = false) {
      doc.setFont("helvetica", header ? "bold" : "normal");
      const lines = cells.map((cell) => doc.splitTextToSize(cell, cellWidth - 4) as string[]);
      const count = Math.max(1, ...lines.map((cell) => cell.length));
      for (let i = 0; i < count; i++) {
        if (y + lineHeight + 2 > bottom) {
          doc.addPage();
          y = margin;
          if (!header) tableRow(letter.table!.headers, true);
          doc.setFont("helvetica", header ? "bold" : "normal");
        }
        lines.forEach((cell, column) => {
          doc.text(cell[i] ?? "", margin + column * cellWidth + 2, y);
        });
        y += lineHeight;
      }
      doc.setDrawColor(170);
      doc.line(margin, y - 3, margin + width, y - 3);
      y += 3;
    }
    tableRow(letter.table.headers, true);
    letter.table.rows.forEach((row) => tableRow(row));
  } else paragraph(letter.results);
  heading("Conditions and next steps");
  letter.conditions.forEach((condition) => paragraph(condition));
  return doc;
}
