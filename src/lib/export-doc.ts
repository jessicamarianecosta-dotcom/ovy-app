import "server-only";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function textToDocx(title: string, body: string): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun(title)],
          }),
          ...body
            .split(/\n+/)
            .filter(Boolean)
            .map(
              (paragraph) =>
                new Paragraph({
                  children: [new TextRun(paragraph)],
                  spacing: { after: 200 },
                })
            ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

export async function textToPdf(title: string, body: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 56;
  const maxWidth = pageWidth - margin * 2;
  const fontSize = 11;
  const lineHeight = 16;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - margin;

  page.drawText(title, {
    x: margin,
    y: cursorY,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  cursorY -= 30;

  function wrapLine(line: string): string[] {
    const words = line.split(" ");
    const result: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) > maxWidth && current) {
        result.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) result.push(current);
    return result;
  }

  const paragraphs = body.split(/\n+/).filter(Boolean);
  for (const paragraph of paragraphs) {
    const lines = wrapLine(paragraph);
    for (const line of lines) {
      if (cursorY < margin) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        cursorY = pageHeight - margin;
      }
      page.drawText(line, { x: margin, y: cursorY, size: fontSize, font });
      cursorY -= lineHeight;
    }
    cursorY -= lineHeight * 0.5;
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
