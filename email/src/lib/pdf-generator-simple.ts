import { DataQualityReportEmailProps } from '../types/dq-report';

export interface PDFReportData {
  country: string;
  dataset: string;
  uploadDate: string;
  uploadId: string;
  dataQualityCheck: any;
  generatedDate: string;
  fileName: string;
}

export class PDFGeneratorSimple {
  async generateDQReportPDF(data: PDFReportData): Promise<Uint8Array> {
    try {
      // Create a simple HTML document that can be converted to PDF
      const html = this.generateHTMLReport(data);
      
      // For now, return a simple text-based "PDF" as a placeholder
      // In a real implementation, you could use a headless browser or PDF library
      const textContent = this.generateTextReport(data);
      const buffer = Buffer.from(textContent, 'utf-8');
      
      return new Uint8Array(buffer);
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  private generateHTMLReport(data: PDFReportData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Data Quality Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { color: #2E7D32; font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 20px; }
        .subheader { font-size: 14px; font-weight: bold; margin: 10px 0; }
        .section { margin: 20px 0; }
        .table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f2f2f2; font-weight: bold; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="header">Data Quality Report</div>
    
    <div class="section">
        <div class="subheader">Upload ID: ${data.uploadId}</div>
        <div class="subheader">Country: ${data.country}</div>
        <div class="subheader">Dataset: ${data.dataset}</div>
        <div class="subheader">Upload Date: ${data.uploadDate}</div>
    </div>

    <div class="section">
        <div class="subheader">Data Quality Metrics</div>
        ${this.generateMetricsTable(data.dataQualityCheck)}
    </div>

    <div class="footer">
        Generated on: ${data.generatedDate}
    </div>
</body>
</html>`;
  }

  private generateTextReport(data: PDFReportData): string {
    return `
DATA QUALITY REPORT
==================

Upload ID: ${data.uploadId}
Country: ${data.country}
Dataset: ${data.dataset}
Upload Date: ${data.uploadDate}

DATA QUALITY METRICS
===================
${this.generateTextMetrics(data.dataQualityCheck)}

Generated on: ${data.generatedDate}
`;
  }

  private generateMetricsTable(dataQualityCheck: any): string {
    if (!dataQualityCheck || !dataQualityCheck.checks) {
      return '<p>No data quality checks available</p>';
    }

    let tableHTML = '<table class="table"><tr><th>Check Name</th><th>Status</th><th>Message</th></tr>';
    
    dataQualityCheck.checks.forEach((check: any) => {
      const status = check.status || 'Unknown';
      const statusColor = status === 'PASS' ? '#4CAF50' : status === 'FAIL' ? '#F44336' : '#FF9800';
      tableHTML += `
        <tr>
          <td>${check.name || 'Unknown Check'}</td>
          <td style="color: ${statusColor}; font-weight: bold;">${status}</td>
          <td>${check.message || 'No message'}</td>
        </tr>`;
    });
    
    tableHTML += '</table>';
    return tableHTML;
  }

  private generateTextMetrics(dataQualityCheck: any): string {
    if (!dataQualityCheck || !dataQualityCheck.checks) {
      return 'No data quality checks available';
    }

    let text = '';
    dataQualityCheck.checks.forEach((check: any) => {
      text += `${check.name || 'Unknown Check'}: ${check.status || 'Unknown'} - ${check.message || 'No message'}\n`;
    });
    
    return text;
  }
}
