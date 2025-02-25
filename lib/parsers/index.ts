// src/lib/parsers/index.ts
import * as PDFJS from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
PDFJS.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.js`;

// Common tech keywords to look for
const TECH_KEYWORDS = [
  // Languages
  'javascript', 'python', 'java', 'c++', 'typescript', 'ruby', 'php',
  // Frontend
  'react', 'angular', 'vue', 'html', 'css', 'tailwind',
  // Backend
  'node', 'express', 'django', 'flask', 'spring', 'rails',
  // Databases
  'sql', 'mysql', 'postgresql', 'mongodb', 'redis',
  // Cloud & DevOps
  'aws', 'azure', 'docker', 'kubernetes', 'jenkins', 'git'
];

export class TextExtractor {
  static async extract(file: File) {
    const text = await this.extractText(file);
    const keywords = this.findKeywords(text);
    return { text, keywords };
  }

  private static async extractText(file: File): Promise<string> {
    const fileType = file.name.split('.').pop()?.toLowerCase();

    if (fileType === 'pdf') {
      return this.extractPdfText(file);
    } else if (fileType === 'docx') {
      return this.extractDocxText(file);
    } else if (fileType === 'txt') {
      return file.text();
    } else {
      throw new Error('Unsupported file type');
    }
  }

  private static async extractPdfText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFJS.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => item.str).join(' ');
      fullText += text + '\n';
    }
    
    return fullText;
  }

  private static async extractDocxText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  private static findKeywords(text: string): string[] {
    const normalizedText = text.toLowerCase();
    return TECH_KEYWORDS.filter(keyword => 
      normalizedText.includes(keyword.toLowerCase())
    );
  }
}