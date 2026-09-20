export interface OCRResult {
  text: string;
  pages: Array<{ pageNumber: number; text: string }>;
}

export interface OCRProvider {
  recognize(input: { bytes: Uint8Array; mimeType?: string }): Promise<OCRResult>;
}

export class UnsupportedOCRProvider implements OCRProvider {
  async recognize(): Promise<OCRResult> {
    throw new Error('OCR is not configured. Scanned PDFs need an OCR provider.');
  }
}
