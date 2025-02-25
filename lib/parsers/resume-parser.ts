// src/lib/parsers/resume-parser.ts
import { extractTechStack } from '../constants/tech-keywords';
import * as mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';

export async function parseResume(file: File): Promise<{
  text: string;
  techStack: string[];
}> {
  const text = await extractText(file);
  const techStack = extractTechStack(text);

  return {
    text,
    techStack
  };
}

async function extractText(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'docx':
      return extractFromDOCX(file);
    case 'pdf':
      return extractFromPDF(file);
    case 'txt':
      return extractFromTXT(file);
    default:
      throw new Error('Unsupported file format');
  }
}

async function extractFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let text = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(' ') + '\n';
  }

  return text;
}

async function extractFromTXT(file: File): Promise<string> {
  const text = await file.text();
  return text;
}