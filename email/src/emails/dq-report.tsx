import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import CheckWithError from "../components/CheckWithError";
import DqReportHeading from "../components/DqReportHeading";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { dqResultSummary } from "../constants/dq-result-summary";
import tailwindConfig from "../styles/tailwind.config";
import type { DataQualityReportEmailProps } from "../types/dq-report";
import { isSummaryCheck } from "../utils/dq-report";

const baseUrl = process.env.WEB_APP_REDIRECT_URI;

const DataQualityReport = ({
  dataQualityCheck,
  dataset,
  uploadDate,
  uploadId,
}: DataQualityReportEmailProps) => {
  const hasCriticalError = Boolean(
    dataQualityCheck["critical_error_check"]?.[0]?.percent_failed > 0,
  );

  const title = hasCriticalError
    ? "Data Check Error: Action Required!"
    : "Data Check Warnings: Action Required!";

  const checks = Object.keys(dataQualityCheck)
    .filter(key => {
      if (key === "summary") return false;
      if (key === "critical_error_check") return false;
      return true;
    })
    .map(key => {
      const check = dataQualityCheck[key];
      if (isSummaryCheck(check)) {
        return (
          <>
            <Text className="my-1">
              Checks performed at <strong>{check.timestamp}</strong>
            </Text>
            <Text className="my-1">
              Total rows: <strong>{check.rows}</strong>
            </Text>
            <Text className="my-1">
              Total columns: <strong>{check.columns}</strong>
            </Text>
          </>
        );
      } else {
        return <CheckWithError checks={check} title={key} />;
      }
    });

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
              <DqReportHeading hasCriticalError={hasCriticalError} title={title} />
              <Text className="my-1">
                Upload Id <strong>{uploadId}</strong>
              </Text>
              <Text className="my-1">
                Dataset: <strong>{dataset}</strong>
              </Text>
              <Text className="my-1">
                File Uploaded at <strong>{uploadDate}</strong>
              </Text>

              <Section className="py-4">{checks}</Section>
              <Section className="text-center my-8 ">
                <Button
                  className="bg-primary px-6 py-4 text-sm font-semibold text-white no-underline text-center"
                  href={`${baseUrl}/upload/${uploadId}`}
                >
                  View Complete Report
                </Button>
              </Section>
              <Footer>
                <Text className="text-[#666666] text-[12px] leading-[24px]">
                  This is an auto-generated email. Please do not reply. For inquiries,
                  you may submit a ticket{" "}
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
  dataset: "School Geolocaiotn",
  uploadDate: new Date().toLocaleString(undefined, {
    timeZoneName: "short",
  }),
  uploadId: "NjA5NzUy",
} satisfies DataQualityReportEmailProps;

export default DataQualityReport;
