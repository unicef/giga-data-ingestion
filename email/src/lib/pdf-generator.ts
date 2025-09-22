import puppeteer, { Browser } from 'puppeteer';
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

export class PDFGenerator {
  private browser: Browser | null = null;

  async initialize() {
    if (!this.browser) {
      try {
        this.browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        });
      } catch (error) {
        console.error('Failed to initialize Puppeteer browser:', error);
        throw new Error(`PDF generation failed: ${error.message}`);
      }
    }
  }

  async generateDQReportPDF(data: PDFReportData): Promise<Uint8Array> {
    await this.initialize();
    
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 800 });

    // Generate HTML content for the PDF
    const htmlContent = this.generatePDFHTML(data);

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });

    await page.close();
    return pdfBuffer;
  }

  private generatePDFHTML(data: PDFReportData): string {
    const { country, dataset, uploadDate, uploadId, dataQualityCheck, generatedDate, fileName } = data;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Data Quality Report - ${country}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            color: #333;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 20px;
        }
        .header-left {
            font-size: 24px;
            font-weight: bold;
            color: #2c5aa0;
        }
        .header-right {
            font-size: 18px;
            color: #666;
        }
        .main-title {
            text-align: center;
            font-size: 28px;
            font-weight: bold;
            color: #2c5aa0;
            margin: 30px 0;
        }
        .report-meta {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
        }
        .report-meta p {
            margin: 5px 0;
            font-size: 14px;
        }
        .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 15px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .metric-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .metric-label {
            font-weight: 500;
        }
        .metric-value {
            font-weight: bold;
            color: #2c5aa0;
        }
        .comment-box {
            background: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 3px;
            padding: 10px;
            margin-top: 10px;
            min-height: 40px;
        }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: white;
            border-top: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 20px;
            font-size: 12px;
            color: #666;
        }
        .page-number {
            font-weight: bold;
        }
        .logos {
            display: flex;
            gap: 15px;
            align-items: center;
        }
        .logo {
            height: 20px;
        }
        @media print {
            .footer {
                position: fixed;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">Giga Sync</div>
        <div class="header-right">giga global</div>
    </div>

    <div class="main-title">Data Quality Report - ${country}</div>

    <div class="report-meta">
        <p><strong>Generated on:</strong> ${generatedDate}</p>
        <p><strong>Uploaded File:</strong> ${fileName}</p>
        <p><strong>Upload ID:</strong> ${uploadId}</p>
        <p><strong>Dataset:</strong> ${dataset}</p>
        <p><strong>Upload Date:</strong> ${uploadDate}</p>
    </div>

    <div class="section">
        <div class="section-title">File Overview</div>
        <div class="metrics-grid">
            <div class="metric-item">
                <span class="metric-label">Count Of Schools in Uploaded File</span>
                <span class="metric-value">${dataQualityCheck?.summary?.rows || 'N/A'}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Count Of Schools That Passed Checks</span>
                <span class="metric-value">${this.calculatePassedSchools(dataQualityCheck)}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Count Of Schools That Failed The Critical Checks</span>
                <span class="metric-value">${this.calculateFailedSchools(dataQualityCheck)}</span>
            </div>
        </div>
        <div class="comment-box">
            ${this.getFileOverviewComment(dataQualityCheck)}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Location Quality</div>
        <div class="metrics-grid">
            <div class="metric-item">
                <span class="metric-label">Missing Lat/Long</span>
                <span class="metric-value">${this.getMetricValue(dataQualityCheck, 'missing')}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Schools Outside Country Boundary</span>
                <span class="metric-value">${this.getMetricValue(dataQualityCheck, 'boundary')}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Low Precision Lat/Long (< 5 digits)</span>
                <span class="metric-value">${this.getMetricValue(dataQualityCheck, 'precision')}</span>
            </div>
        </div>
        <div class="comment-box">
            Review outside boundary schools. Correct low-precision lat/longs.
        </div>
    </div>

    <div class="section">
        <div class="section-title">School ID Checks</div>
        <div class="metrics-grid">
            <div class="metric-item">
                <span class="metric-label">Duplicate School IDs</span>
                <span class="metric-value">${this.getMetricValue(dataQualityCheck, 'duplicate')}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Missing School IDs</span>
                <span class="metric-value">${this.getMetricValue(dataQualityCheck, 'school_id')}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Missing School Names</span>
                <span class="metric-value">${this.getMetricValue(dataQualityCheck, 'school_name')}</span>
            </div>
        </div>
        <div class="comment-box">
            <!-- Empty comment box -->
        </div>
    </div>

    <div class="section">
        <div class="section-title">Education Level Data</div>
        <div class="metrics-grid">
            <div class="metric-item">
                <span class="metric-label">Primary School</span>
                <span class="metric-value">${this.getMetricValue(dataQualityCheck, 'primary')}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Secondary School</span>
                <span class="metric-value">${this.getMetricValue(dataQualityCheck, 'secondary')}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Combined School</span>
                <span class="metric-value">${this.getMetricValue(dataQualityCheck, 'combined')}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Intermediate School</span>
                <span class="metric-value">${this.getMetricValue(dataQualityCheck, 'intermediate')}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">ECD</span>
                <span class="metric-value">${this.getMetricValue(dataQualityCheck, 'ecd')}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Special Needs</span>
                <span class="metric-value">${this.getMetricValue(dataQualityCheck, 'special')}</span>
            </div>
        </div>
        <div class="comment-box">
            <!-- Empty comment box -->
        </div>
    </div>

    <div class="section">
        <div class="section-title">Connectivity Data</div>
        <div class="metrics-grid">
            <div class="metric-item">
                <span class="metric-label">Missing Internet Availability Flag</span>
                <span class="metric-value">${this.getMetricValue(dataQualityCheck, 'internet')}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Connectivity Type Missing</span>
                <span class="metric-value">${this.getMetricValue(dataQualityCheck, 'connectivity')}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Reported Internet Availability</span>
                <span class="metric-value">${this.getMetricValue(dataQualityCheck, 'reported')}</span>
            </div>
        </div>
        <div class="comment-box">
            Review outside boundary schools, Correct low-precision lat/longs.
        </div>
    </div>

    <div class="section">
        <div class="section-title">Computer Availability</div>
        <div class="metrics-grid">
            <div class="metric-item">
                <span class="metric-label">Missing Computer Availability Data</span>
                <span class="metric-value">${this.getMetricValue(dataQualityCheck, 'computer')}</span>
            </div>
        </div>
        <div class="comment-box">
            <!-- Empty comment box -->
        </div>
    </div>

    <div class="section">
        <div class="section-title">Density & Duplication Checks</div>
        <div class="metrics-grid">
            <div class="metric-item">
                <span class="metric-label">High-density Schools (>5 within 700m)</span>
                <span class="metric-value">${this.getMetricValue(dataQualityCheck, 'density')}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Total Suspected Duplicate Rows</span>
                <span class="metric-value">${this.getMetricValue(dataQualityCheck, 'duplicate_rows')}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Same education level + geolocation</span>
                <span class="metric-value">${this.getMetricValue(dataQualityCheck, 'education_geo')}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Same name + education level + geolocation within 110m</span>
                <span class="metric-value">${this.getMetricValue(dataQualityCheck, 'name_geo_110m')}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Same name + education level + geolocation within 110m + level</span>
                <span class="metric-value">${this.getMetricValue(dataQualityCheck, 'name_geo_level')}</span>
            </div>
        </div>
        <div class="comment-box">
            <!-- Empty comment box -->
        </div>
    </div>

    <div class="section">
        <div class="section-title">Next Steps</div>
        <div class="comment-box">
            <!-- Empty comment box for user notes -->
        </div>
    </div>

    <div class="footer">
        <div class="page-number">01</div>
        <div class="logos">
            <span>giga</span>
            <span>unicef for every child</span>
            <span>ITU</span>
        </div>
    </div>
</body>
</html>`;
  }

  // Country code is used directly since it's already stored as ISO code in the database

  private calculatePassedSchools(dataQualityCheck: any): number {
    if (!dataQualityCheck?.summary?.rows) return 0;
    const failed = this.calculateFailedSchools(dataQualityCheck);
    return dataQualityCheck.summary.rows - failed;
  }

  private calculateFailedSchools(dataQualityCheck: any): number {
    if (!dataQualityCheck?.critical_error_check) return 0;
    // Sum up all failed schools from critical error checks
    return dataQualityCheck.critical_error_check.reduce((total: number, check: any) => {
      return total + (check.count_failed || 0);
    }, 0);
  }

  private getMetricValue(dataQualityCheck: any, metricKey: string): string {
    if (!dataQualityCheck) return '0';
    
    // Search through all check types for the specific metric
    const checkTypes = [
      'completeness_checks',
      'critical_error_check', 
      'domain_checks',
      'duplicate_rows_checks',
      'format_validation_checks',
      'geospatial_checks',
      'range_checks'
    ];
    
    for (const checkType of checkTypes) {
      if (dataQualityCheck[checkType] && Array.isArray(dataQualityCheck[checkType])) {
        const check = dataQualityCheck[checkType].find((c: any) => {
          const description = c.description?.toLowerCase() || '';
          const column = c.column?.toLowerCase() || '';
          const assertion = c.assertion?.toLowerCase() || '';
          const searchKey = metricKey.toLowerCase();
          
          return description.includes(searchKey) ||
                 column.includes(searchKey) ||
                 assertion.includes(searchKey);
        });
        if (check) {
          return check.count_failed?.toString() || '0';
        }
      }
    }
    
    return '0';
  }

  private getFileOverviewComment(dataQualityCheck: any): string {
    const failed = this.calculateFailedSchools(dataQualityCheck);
    if (failed > 0) {
      return `Dropped schools = ${failed} investigate why they were excluded`;
    }
    return '';
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
