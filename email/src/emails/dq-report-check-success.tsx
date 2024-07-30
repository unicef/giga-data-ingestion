import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import Footer from "../components/Footer";
import Header from "../components/Header";
import tailwindConfig from "../styles/tailwind.config";
import type { DataQualityCheckSuccessProps } from "../types/dq-report";

const baseUrl = process.env.WEB_APP_REDIRECT_URI;

export const DataQualityReportCheckSuccess = ({
  uploadId,
  dataset,
  uploadDate,
  checkDate,
}: DataQualityCheckSuccessProps) => {
  const previewText = "Successful data quality checks";

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
        <Preview>{previewText}</Preview>
        <Body className=" bg-white px-2 font-sans">
          <Container className="mx-auto my-10 max-w-md rounded border border-giga-light-gray border-solid p-5">
            <Header />

            <div className="mx-auto p-6">
              <Heading className="flex p-0 align-middle font-normal text-2xl text-giga-green">
                <Img
                  className="-mt-1 mr-2 h-10 w-10"
                  src="https://storage.googleapis.com/giga-test-app-static-assets/CheckmarkOutlineGreen.png"
                />
                <strong>Data check successful</strong>
              </Heading>
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
                Checks performed at <strong>{checkDate}</strong>
              </Text>

              <Section className="my-8 text-center">
                <Button
                  className="bg-primary px-6 py-4 text-center font-semibold text-sm text-white no-underline"
                  href={`${baseUrl}/upload/${uploadId}`}
                >
                  View Complete Report
                </Button>
              </Section>

              <Footer>
                Your file successfully completed data checks. You may view the checks
                performed on Giga Sync.
              </Footer>
            </div>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

DataQualityReportCheckSuccess.PreviewProps = {
  uploadId: "NjA5NzUy",
  dataset: "School Geolocation",
  uploadDate: new Date().toLocaleString(undefined, {
    timeZoneName: "short",
  }),
  checkDate: new Date().toLocaleString(undefined, {
    timeZoneName: "short",
  }),
} satisfies DataQualityCheckSuccessProps;

export default DataQualityReportCheckSuccess;
