import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Img,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import tailwindConfig from "../styles/tailwind.config";
import { DataQualityCheckSuccessProps } from "../types/dq-report";
import Header from "../components/Header";
import Footer from "../components/Footer";

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
          <Container className="border border-solid border-giga-light-gray rounded my-10 mx-auto p-5 max-w-md">
            <Header />

            <div className="p-6 mx-auto">
              <Heading className="flex align-middle p-0 text-2xl font-normal text-giga-green">
                <Img
                  className="w-10 h-10 mr-2 -mt-1"
                  src="https://saunigigashare.blob.core.windows.net/assets/CheckmarkOutlineGreen.png"
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

              <Section className="text-center my-8">
                <Button
                  className="bg-primary px-6 py-4 text-sm font-semibold text-white no-underline text-center"
                  href={`${baseUrl}/upload/${uploadId}`}
                >
                  View Complete Report
                </Button>
              </Section>

              <Footer>
                <>
                  Your file successfully completed data checks. You may view the
                  checks performed on Giga Sync.
                </>
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
