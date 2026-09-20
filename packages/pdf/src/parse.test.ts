import { describe, expect, it } from 'vitest';
import { extractPdfText, parsePdfBytes } from './parse.js';

const MINIMAL_PDF = `%PDF-1.1
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj
4 0 obj<< /Length 54 >>stream
BT /F1 24 Tf 72 720 Td (Hello Locked In Reader) Tj ET
endstream
endobj
5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
trailer<< /Root 1 0 R >>
%%EOF
`;

describe('PDF engine', () => {
  it('extracts text and page count from a simple PDF', async () => {
    const bytes = new TextEncoder().encode(MINIMAL_PDF);
    const extracted = extractPdfText(bytes);
    expect(extracted.text).toContain('Hello Locked In Reader');
    expect(extracted.pageCount).toBe(1);
    const document = await parsePdfBytes({ bytes, filename: 'hello.pdf' });
    expect(document.source.kind).toBe('pdf');
    expect(document.blocks.some((block) => block.text.includes('Locked In'))).toBe(true);
    expect(document.metadata.pageCount).toBe(1);
  });

  it('rejects non-pdf bytes', () => {
    expect(() => extractPdfText(new TextEncoder().encode('not a pdf'))).toThrow(/Not a PDF/);
  });
});
