import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import Footer from "../components/Footer";
import Header from "../components/Header";
import tailwindConfig from "../styles/tailwind.config";
import type { DataQualityUploadSuccessProps } from "../types/dq-report";

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
          <Container className="mx-auto my-10 max-w-md rounded border border-giga-light-gray border-solid p-5">
            <Header />
            <div className="mx-auto p-6">
              <Heading className="mx-0 my-[30px] p-0 font-normal text-2xl text-giga-green">
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
                Your file has been successfully uploaded. After a round of checks, your
                file will undergo a review process before being merged into the Master
                dataset. You may view the checks performed on Giga Sync.
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
} satisfies DataQualityUploadSuccessProps;

export default DataQualityReportUploadSuccess;
