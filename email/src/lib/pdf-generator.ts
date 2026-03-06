import { pdf } from '@react-pdf/renderer';
import DataQualityReportPDF from '../emails/dq-report-pdf';
import { DataQualityReportEmailProps } from '../types/dq-report';

export interface PDFReportData extends DataQualityReportEmailProps {
  generatedDate: string;
  uploadedFileName: string;
}

export async function generateDataQualityReportPDF(data: PDFReportData): Promise<Buffer> {
  try {
    const doc = DataQualityReportPDF(data);
    const pdfBuffer = await pdf(doc).toBuffer();
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
}

export function formatDateForPDF(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(',', '');
}
