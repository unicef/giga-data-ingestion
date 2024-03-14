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

import { getBase64Image } from "../utils/image";
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
          <Container className="border-gray-4  max-w-[1024] border border-solid ">
            <Text className="bg-primary text-white text-2xl p-4 m-0 flex">
              <Img
                className="w-10 h-10 pr-4 text-black"
                src="https://storage.googleapis.com/giga-test-app-static-assets/GIGA_logo.png"
              />
              <span className="font-light">giga</span>
              <span className="font-bold">sync</span>
            </Text>

            <div className="p-6 mx-auto">
              <Heading className="mx-0 my-[30px] p-0 text-2xl font-normal text-giga-green">
                <strong>Your data quality review is in progress</strong>
              </Heading>
              <Text>
                Upload Id <strong>{uploadId}</strong>
              </Text>
              <Text>
                Dataset: <strong>{dataset}</strong>
              </Text>
              <Text>
                File Uploaded at <strong>{uploadDate}</strong>
              </Text>

              <Hr className="border-gray-4 mx-0 my-6 w-full border border-solid" />
              <Text className="text-gray-4 text-xs">
                Your file has been successfully uploaded. After a round of
                checks, your filewill be merged into Giga. You may view the
                checks performed on the Giga Portal.
              </Text>

              <Section className="my-8 ">
                <Button
                  className="bg-primary px-6 py-4  font-semibold text-white no-underline"
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

DataQualityReportUploadSuccess.PreviewProps = {
  uploadId: "NjA5NzUy",
  dataset: "School Geolocation",
  uploadDate: new Date().toLocaleString(undefined, {
    timeZoneName: "short",
  }),
} as DataQualityUploadSuccessProps;

export default DataQualityReportUploadSuccess;
