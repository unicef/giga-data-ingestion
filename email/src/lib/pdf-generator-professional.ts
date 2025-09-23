import jsPDF from 'jspdf';
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

export class PDFGeneratorProfessional {
  private doc: jsPDF;
  private currentY: number = 0;
  private pageWidth: number = 210; // A4 width in mm
  private pageHeight: number = 297; // A4 height in mm
  private margin: number = 20;

  constructor() {
    this.doc = new jsPDF();
    this.currentY = this.margin;
  }

  async generateDQReportPDF(data: PDFReportData): Promise<Uint8Array> {
    try {
      this.doc = new jsPDF();
      this.currentY = this.margin;
      
      // Add header with logos and title
      this.addHeader(data);
      
      // Add file overview section
      this.addFileOverview(data);
      
      // Add location quality section
      this.addLocationQuality(data);
      
      // Add school ID checks section
      this.addSchoolIdChecks(data);
      
      // Add education level data section
      this.addEducationLevelData(data);
      
      // Check if we need a new page
      if (this.currentY > this.pageHeight - 80) {
        this.doc.addPage();
        this.currentY = this.margin;
      }
      
      // Add connectivity data section
      this.addConnectivityData(data);
      
      // Add computer availability section
      this.addComputerAvailability(data);
      
      // Add density & duplication checks section
      this.addDensityDuplicationChecks(data);
      
      // Add next steps section
      this.addNextSteps(data);
      
      // Add footer
      this.addFooter();
      
      const pdfBuffer = this.doc.output('arraybuffer');
      return new Uint8Array(pdfBuffer);
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  private addHeader(data: PDFReportData) {
    // Add Giga Sync logo (placeholder text for now)
    this.doc.setFontSize(16);
    this.doc.setTextColor(0, 102, 204); // Blue color
    this.doc.text('Giga Sync', this.margin, 15);
    
    // Add giga global logo (placeholder text for now)
    this.doc.text('giga global', this.pageWidth - this.margin - 30, 15);
    
    // Add main title
    this.doc.setFontSize(24);
    this.doc.setTextColor(0, 102, 204); // Blue color
    this.doc.text(`Data Quality Report - ${data.country}`, this.pageWidth / 2, 35, { align: 'center' });
    
    // Add generated date
    this.doc.setFontSize(10);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(`Generated on: ${data.generatedDate}`, this.margin, 45);
    this.doc.text(`Uploaded File: ${data.fileName}`, this.margin, 50);
    
    this.currentY = 60;
  }

  private addFileOverview(data: PDFReportData) {
    this.addSectionHeader('File Overview');
    
    const dq = data.dataQualityCheck;
    const summary = dq?.summary || {};
    const passedSchools = this.calculatePassedSchools(dq);
    const failedSchools = this.calculateFailedSchools(dq);
    
    this.addMetricRow('Count Of Schools in Uploaded File', summary.rows?.toString() || '0');
    this.addMetricRow('Count Of Schools That Passed Checks', passedSchools);
    this.addMetricRow('Count Of Schools That Failed The Critical Checks', failedSchools);
    this.addCommentRow(this.getFileOverviewComment(dq));
    
    this.currentY += 10;
  }

  private addLocationQuality(data: PDFReportData) {
    this.addSectionHeader('Location Quality');
    
    const dq = data.dataQualityCheck;
    
    this.addMetricRow('Missing Lat/Long', this.getMetricValue(dq, 'geospatial_checks', 'missing_lat_long'));
    this.addMetricRow('Schools Outside Country Boundary', this.getMetricValue(dq, 'geospatial_checks', 'outside_boundary'));
    this.addMetricRow('Low Precision Lat/Long (< 5 digits)', this.getMetricValue(dq, 'geospatial_checks', 'low_precision'));
    this.addCommentRow(this.getLocationQualityComment(dq));
    
    this.currentY += 10;
  }

  private addSchoolIdChecks(data: PDFReportData) {
    this.addSectionHeader('School ID Checks');
    
    const dq = data.dataQualityCheck;
    
    this.addMetricRow('Duplicate School IDs', this.getMetricValue(dq, 'duplicate_rows_checks', 'duplicate_ids'));
    this.addMetricRow('Missing School IDs', this.getMetricValue(dq, 'completeness_checks', 'missing_school_id'));
    this.addMetricRow('Missing School Names', this.getMetricValue(dq, 'completeness_checks', 'missing_school_name'));
    this.addCommentRow(this.getSchoolIdComment(dq));
    
    this.currentY += 10;
  }

  private addEducationLevelData(data: PDFReportData) {
    this.addSectionHeader('Education Level Data');
    
    const dq = data.dataQualityCheck;
    
    this.addMetricRow('Primary School', this.getMetricValue(dq, 'domain_checks', 'primary_school'));
    this.addMetricRow('Secondary School', this.getMetricValue(dq, 'domain_checks', 'secondary_school'));
    this.addMetricRow('Combined School', this.getMetricValue(dq, 'domain_checks', 'combined_school'));
    this.addMetricRow('Intermediate School', this.getMetricValue(dq, 'domain_checks', 'intermediate_school'));
    this.addMetricRow('ECD', this.getMetricValue(dq, 'domain_checks', 'ecd'));
    this.addMetricRow('Special Needs', this.getMetricValue(dq, 'domain_checks', 'special_needs'));
    this.addCommentRow(this.getEducationLevelComment(dq));
    
    this.currentY += 10;
  }

  private addConnectivityData(data: PDFReportData) {
    this.addSectionHeader('Connectivity Data');
    
    const dq = data.dataQualityCheck;
    
    this.addMetricRow('Missing Internet Availability Flag', this.getMetricValue(dq, 'completeness_checks', 'missing_internet_flag'));
    this.addMetricRow('Connectivity Type Missing', this.getMetricValue(dq, 'completeness_checks', 'missing_connectivity_type'));
    this.addMetricRow('Reported Internet Availability', this.getMetricValue(dq, 'domain_checks', 'reported_internet'));
    this.addCommentRow(this.getConnectivityComment(dq));
    
    this.currentY += 10;
  }

  private addComputerAvailability(data: PDFReportData) {
    this.addSectionHeader('Computer Availability');
    
    const dq = data.dataQualityCheck;
    
    this.addMetricRow('Missing Computer Availability Data', this.getMetricValue(dq, 'completeness_checks', 'missing_computer_data'));
    this.addCommentRow(this.getComputerAvailabilityComment(dq));
    
    this.currentY += 10;
  }

  private addDensityDuplicationChecks(data: PDFReportData) {
    this.addSectionHeader('Density & Duplication Checks');
    
    const dq = data.dataQualityCheck;
    
    this.addMetricRow('High-density Schools (>5 within 700m)', this.getMetricValue(dq, 'duplicate_rows_checks', 'high_density'));
    this.addMetricRow('Total Suspected Duplicate Rows', this.getMetricValue(dq, 'duplicate_rows_checks', 'total_duplicates'));
    this.addMetricRow('Same education level + geolocation', this.getMetricValue(dq, 'duplicate_rows_checks', 'same_education_geo'));
    this.addMetricRow('Same name + education level + geolocation within 110m', this.getMetricValue(dq, 'duplicate_rows_checks', 'same_name_education_geo'));
    this.addMetricRow('Same name + education level + geolocation within 110m + level', this.getMetricValue(dq, 'duplicate_rows_checks', 'same_name_education_geo_level'));
    this.addCommentRow(this.getDensityComment(dq));
    
    this.currentY += 10;
  }

  private addNextSteps(data: PDFReportData) {
    this.addSectionHeader('Next Steps');
    
    // Add empty text area (placeholder)
    this.doc.setDrawColor(200, 200, 200);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 40);
    
    this.currentY += 45;
    
    this.addCommentRow(this.getNextStepsComment(data.dataQualityCheck));
  }

  private addSectionHeader(title: string) {
    this.doc.setFontSize(14);
    this.doc.setTextColor(0, 102, 204); // Blue color
    this.doc.setFont(undefined, 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 8;
  }

  private addMetricRow(label: string, value: string) {
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont(undefined, 'normal');
    
    // Add label
    this.doc.text(label, this.margin, this.currentY);
    
    // Add value (right aligned)
    const valueWidth = this.doc.getTextWidth(value);
    this.doc.text(value, this.pageWidth - this.margin - valueWidth, this.currentY);
    
    this.currentY += 5;
  }

  private addCommentRow(comment: string) {
    if (comment) {
      this.doc.setFontSize(9);
      this.doc.setTextColor(100, 100, 100);
      this.doc.setFont(undefined, 'italic');
      this.doc.text(`Comment: ${comment}`, this.margin, this.currentY);
      this.currentY += 5;
    }
  }

  private addFooter() {
    const footerY = this.pageHeight - 20;
    
    // Add page number
    this.doc.setFontSize(10);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('01', this.pageWidth / 2, footerY, { align: 'center' });
    
    // Add logos (placeholder text)
    this.doc.text('giga', this.margin, footerY);
    this.doc.text('unicef for every child', this.pageWidth / 2 - 30, footerY);
    this.doc.text('ITU', this.pageWidth - this.margin - 10, footerY);
  }

  // Helper methods (same as before)
  private getMetricValue(dq: any, category: string, metricName: string): string {
    if (!dq || !dq[category]) return '0';
    
    const checks = dq[category];
    const check = checks.find((c: any) => 
      c.assertion?.toLowerCase().includes(metricName.toLowerCase()) ||
      c.description?.toLowerCase().includes(metricName.toLowerCase()) ||
      c.column?.toLowerCase().includes(metricName.toLowerCase())
    );
    
    return check ? check.count_failed?.toString() || '0' : '0';
  }

  private calculatePassedSchools(dq: any): string {
    if (!dq?.summary) return '0';
    const total = dq.summary.rows || 0;
    const failed = this.calculateFailedSchoolsNumber(dq);
    return (total - failed).toString();
  }

  private calculateFailedSchools(dq: any): string {
    return this.calculateFailedSchoolsNumber(dq).toString();
  }

  private calculateFailedSchoolsNumber(dq: any): number {
    if (!dq) return 0;
    
    let totalFailed = 0;
    const categories = ['critical_error_check', 'completeness_checks', 'geospatial_checks'];
    
    categories.forEach(category => {
      if (dq[category]) {
        dq[category].forEach((check: any) => {
          totalFailed += check.count_failed || 0;
        });
      }
    });
    
    return totalFailed;
  }

  private getFileOverviewComment(dq: any): string {
    const failed = this.calculateFailedSchoolsNumber(dq);
    if (failed > 0) {
      return `Dropped schools = ${failed} investigate why they were excluded`;
    }
    return 'All schools passed the data quality checks';
  }

  private getLocationQualityComment(dq: any): string {
    const outsideBoundary = this.getMetricValue(dq, 'geospatial_checks', 'outside_boundary');
    const lowPrecision = this.getMetricValue(dq, 'geospatial_checks', 'low_precision');
    
    if (parseInt(outsideBoundary) > 0 || parseInt(lowPrecision) > 0) {
      return 'Review outside boundary schools. Correct low-precision lat/longs.';
    }
    return 'Location data quality is acceptable';
  }

  private getSchoolIdComment(dq: any): string {
    const duplicateIds = this.getMetricValue(dq, 'duplicate_rows_checks', 'duplicate_ids');
    const missingIds = this.getMetricValue(dq, 'completeness_checks', 'missing_school_id');
    
    if (parseInt(duplicateIds) > 0 || parseInt(missingIds) > 0) {
      return 'Review duplicate and missing school IDs';
    }
    return 'School ID data is complete and unique';
  }

  private getEducationLevelComment(dq: any): string {
    return 'Education level data distribution looks reasonable';
  }

  private getConnectivityComment(dq: any): string {
    const missingInternet = this.getMetricValue(dq, 'completeness_checks', 'missing_internet_flag');
    const missingConnectivity = this.getMetricValue(dq, 'completeness_checks', 'missing_connectivity_type');
    
    if (parseInt(missingInternet) > 0 || parseInt(missingConnectivity) > 0) {
      return 'Review missing connectivity data';
    }
    return 'Connectivity data is complete';
  }

  private getComputerAvailabilityComment(dq: any): string {
    const missingComputer = this.getMetricValue(dq, 'completeness_checks', 'missing_computer_data');
    
    if (parseInt(missingComputer) > 0) {
      return 'Review missing computer availability data';
    }
    return 'Computer availability data is complete';
  }

  private getDensityComment(dq: any): string {
    const highDensity = this.getMetricValue(dq, 'duplicate_rows_checks', 'high_density');
    const totalDuplicates = this.getMetricValue(dq, 'duplicate_rows_checks', 'total_duplicates');
    
    if (parseInt(highDensity) > 0 || parseInt(totalDuplicates) > 0) {
      return 'Review high-density areas and potential duplicate entries';
    }
    return 'No significant density or duplication issues detected';
  }

  private getNextStepsComment(dq: any): string {
    const failed = this.calculateFailedSchoolsNumber(dq);
    const outsideBoundary = this.getMetricValue(dq, 'geospatial_checks', 'outside_boundary');
    const lowPrecision = this.getMetricValue(dq, 'geospatial_checks', 'low_precision');
    
    let steps = [];
    
    if (failed > 0) {
      steps.push(`- Investigate ${failed} schools that failed critical checks`);
    }
    
    if (parseInt(outsideBoundary) > 0) {
      steps.push(`- Review ${outsideBoundary} schools outside country boundary`);
    }
    
    if (parseInt(lowPrecision) > 0) {
      steps.push(`- Correct ${lowPrecision} schools with low-precision coordinates`);
    }
    
    if (steps.length === 0) {
      steps.push('- Data quality is acceptable, proceed with data processing');
    }
    
    return steps.join('\n');
  }
}
