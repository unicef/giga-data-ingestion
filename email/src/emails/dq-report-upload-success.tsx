import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Img,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import tailwindConfig from "../styles/tailwind.config";
import { DataQualityUploadSuccessProps } from "../types/dq-report";
import Header from "../components/Header";
import Footer from "../components/Footer";
const baseUrl = process.env.WEB_APP_REDIRECT_URI;

export const DataQualityReportUploadSuccess = ({
  uploadId,
  dataset,
  uploadDate,
}: DataQualityUploadSuccessProps) => {
  const previewText = "Successful file upload";

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
              <Heading className="mx-0 my-[30px] p-0 text-2xl font-normal text-giga-green">
                <strong>Your data quality review is in progress</strong>
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

              <Footer>
                <>
                  Your file has been successfully uploaded. After a round of
                  checks, your file will undergo a review process before being
                  merged into the Master dataset. You may view the checks
                  performed on Giga Sync.
                </>
              </Footer>
            </div>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

DataQualityReportUploadSuccess.PreviewProps = {
  uploadId: "NjA5NzUy",
  dataset: "School Geolocation",
  uploadDate: new Date().toLocaleString(undefined, {
    timeZoneName: "short",
  }),
} as DataQualityUploadSuccessProps;

export default DataQualityReportUploadSuccess;
