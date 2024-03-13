import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Img,
  Hr,
  Section,
  Preview,
  Row,
  Column,
  Html,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import tailwindConfig from "../styles/tailwind.config";
import { DataQualityReportEmailProps } from "../types/dq-report";
import { dqResultSummary } from "../constants/dq-result-summary";
import { cn } from "../lib/utils";
import ChecksWithError from "../components/ChecksWithError";

import { getBase64Image } from "../utils/image";

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

  const gigaLogo = getBase64Image("../static/GIGA_logo.png");
  const MisuseOutlineRed = getBase64Image("../static/MisuseOutlineRed.png");
  const MisuseOutlineYellow = getBase64Image(
    "../static/MisuseOutlineYellow.png"
  );

  const hasCriticalError = critical_error_check[0].percent_failed > 1;
  const titleText = hasCriticalError
    ? "Data Check Error: Action Required!"
    : "Data Check Warnings: Action Required!";
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
        <Preview>{titleText}</Preview>
        <Body className=" bg-white px-2 font-sans">
          <Container className="border-gray-4  max-w-[1024] border border-solid ">
            <Text className="bg-primary text-white text-2xl p-4 m-0 flex">
              <Img
                className="w-10 h-10 pr-4 text-black"
                src={`data:image/png;base64,${gigaLogo}`}
              />
              <span className="font-light">giga</span>
              <span className="font-bold">sync</span>
            </Text>

            <div className="p-10 mx-auto gap-6">
              <Heading className="flex align-middle p-0 text-2xl font-normal ">
                <Img
                  className="w-10 h-10 mr-2 -mt-1"
                  src={`data:image/png;base64,${
                    hasCriticalError ? MisuseOutlineRed : MisuseOutlineYellow
                  }`}
                />
                <strong
                  className={cn({
                    "text-giga-red": hasCriticalError,
                    "text-giga-yellow": !hasCriticalError,
                  })}
                >
                  {titleText}
                </strong>
              </Heading>

              <Section className="flex flex-col gap-4 px-0">
                <Column className="list-none m-0 p-0">
                  <Row>
                    Upload Id <strong>{uploadId}</strong>
                  </Row>
                  <Row>
                    {" "}
                    Dataset: <strong>{dataset}</strong>
                  </Row>
                  <Row>
                    File Uploaded at <strong>{uploadDate}</strong>
                  </Row>
                  <Row>
                    Checks performed at <strong>{timestamp}</strong>
                  </Row>
                  <Row>
                    Total rows: <strong>{rows}</strong>
                  </Row>
                  <Row>
                    Total columns: <strong>{columns}</strong>
                  </Row>
                </Column>
              </Section>

              <ChecksWithError
                checks={format_validation_checks}
                title="Format Validation Checks"
              />

              <ChecksWithError
                checks={completeness_checks}
                title="Completeness checks"
              />
              <ChecksWithError checks={domain_checks} title="Domain checks" />
              <ChecksWithError checks={range_checks} title="Range Checks" />
              <ChecksWithError
                checks={duplicate_rows_checks}
                title="Duplicate Rows Checks"
              />
              <ChecksWithError
                checks={geospatial_checks}
                title="Geospatial Checks"
              />

              <Hr className="border-gray-6 mx-0 w-full border border-solid" />

              <Text className="px-4">
                View the complete report on the Upload Portal
              </Text>
              <Section className="my-8 ">
                <Button
                  className="bg-primary px-4 py-2  font-semibold text-white no-underline"
                  href={`${baseUrl}/check-file-uploads/${uploadId}`}
                >
                  View Complete Report
                </Button>
              </Section>
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
