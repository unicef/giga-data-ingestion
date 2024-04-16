import {
  Body,
  Button,
  Container,
  Head,
  Section,
  Preview,
  Html,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import tailwindConfig from "../styles/tailwind.config";
import { DataQualityReportEmailProps } from "../types/dq-report";
import { dqResultSummary } from "../constants/dq-result-summary";
import CheckWithError from "../components/CheckWithError";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DqReportHeading from "../components/DqReportHeading";
const baseUrl = process.env.WEB_APP_REDIRECT_URI;

const DataQualityReport = ({
  dataQualityCheck,
  dataset,
  uploadDate,
  uploadId,
}: DataQualityReportEmailProps) => {
  const {
    completeness_checks,
    critical_error_check,
    domain_checks,
    duplicate_rows_checks,
    format_validation_checks,
    geospatial_checks,
    range_checks,
    summary: { columns, rows, timestamp },
  } = dataQualityCheck;

  const hasCriticalError = critical_error_check[0].percent_failed > 0;

  const title = hasCriticalError
    ? "Data Check Error: Action Required!"
    : "Data Check Warnings: Action Required!";

  const checks = [
    { check: critical_error_check, title: "Critical Error Checks" },
    { check: format_validation_checks, title: "Format Validation Checks" },
    { check: completeness_checks, title: "Completeness Checks" },
    { check: domain_checks, title: "Domain Checks" },
    { check: range_checks, title: "Range Checks" },
    { check: duplicate_rows_checks, title: "Duplicate Rows Checks" },
    { check: geospatial_checks, title: "Geospatial Checks" },
  ];

  const Checks = checks.map(({ check, title }) => (
    <CheckWithError checks={check} title={title} />
  ));

  return (
    <Html>
      <Tailwind config={tailwindConfig}>
        <Head>
          <title>Welcome to Giga Sync</title>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </Head>
        <Preview>{title}</Preview>
        <Body className=" bg-white px-2 font-sans">
          <Container className="border border-solid border-giga-light-gray rounded my-10 mx-auto p-5 max-w-2xl">
            <Header />
            <div className="p-6 mx-auto">
              <DqReportHeading
                hasCriticalError={hasCriticalError}
                title={title}
              />
              <Text className="my-1">
                Upload Id <strong>{uploadId}</strong>
              </Text>
              <Text className="my-1">
                Dataset: <strong>{dataset}</strong>
              </Text>
              <Text className="my-1">
                File Uploaded at <strong>{uploadDate}</strong>
              </Text>
              <Text className="my-1">
                Checks performed at <strong>{timestamp}</strong>
              </Text>
              <Text className="my-1">
                Total rows: <strong>{rows}</strong>
              </Text>
              <Text className="my-1">
                Total columns: <strong>{columns}</strong>
              </Text>

              <Section className="py-4">{Checks}</Section>

              <Section className="text-center my-8 ">
                <Button
                  className="bg-primary px-5 py-3 text-sm rounded font-semibold text-white no-underline text-center"
                  href={`${baseUrl}/check-file-uploads/${uploadId}`}
                >
                  View Complete Report
                </Button>
              </Section>

              <Footer>
                <>View the complete report on the Upload Portal</>
              </Footer>
            </div>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

DataQualityReport.PreviewProps = {
  dataQualityCheck: dqResultSummary,
  dataset: "School Geolocaiotn",
  uploadDate: new Date().toLocaleString(undefined, {
    timeZoneName: "short",
  }),
  uploadId: "NjA5NzUy",
} satisfies DataQualityReportEmailProps;

export default DataQualityReport;
