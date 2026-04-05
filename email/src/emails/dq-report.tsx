import {
  Body,
  Button,
  Container,
  Head,
  Section,
  Preview,
  Html,
  Text,
  Link,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import tailwindConfig from "../styles/tailwind.config";
import { DataQualityReportEmailProps } from "../types/dq-report";
import { dqResultSummary } from "../constants/dq-result-summary";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DqReportHeading from "../components/DqReportHeading";

const baseUrl = process.env.WEB_APP_REDIRECT_URI;

const DataQualityReport = ({
  dataQualityCheck,
  dataset,
  uploadDate,
  uploadId,
  country,
}: DataQualityReportEmailProps) => {
  const hasCriticalError = Boolean(
    dataQualityCheck["critical_error_check"]?.[0]?.percent_failed > 0,
  );

  const title = hasCriticalError
    ? "Data Check Error: Action Required!"
    : "Data Check Warnings: Action Required!";

  // Get summary information for the email
  const summary = dataQualityCheck?.summary;
  const totalRows = summary?.rows || 0;
  const totalColumns = summary?.columns || 0;
  const checkTimestamp = summary?.timestamp;

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
                Country: <strong>{country}</strong>
              </Text>
              <Text className="my-1">
                File Uploaded at <strong>{uploadDate}</strong>
              </Text>

              <Section className="text-center my-8">
                <Button
                  className="bg-primary px-6 py-4 text-sm font-semibold text-white no-underline text-center"
                  href={`${baseUrl}/upload/${uploadId}`}
                >
                  View Complete Report
                </Button>
              </Section>

              <Footer>
                <Text className="text-[#666666] text-[12px] leading-[24px]">
                  This is an auto-generated email. Please do not reply. For
                  inquiries, you may submit a ticket{" "}
                  <Link
                    href={`https://github.com/unicef/giga-data-ingestion/issues/new`}
                    className="text-blue"
                  >
                    here
                  </Link>
                  .
                </Text>
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
  dataset: "School Geolocation",
  uploadDate: new Date().toLocaleString(undefined, {
    timeZoneName: "short",
  }),
  uploadId: "NjA5NzUy",
  country: "USA",
} satisfies DataQualityReportEmailProps;

export default DataQualityReport;
