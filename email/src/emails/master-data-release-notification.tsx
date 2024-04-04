import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import tailwindConfig from "../styles/tailwind.config";
import { MasterDataReleaseNotificationProps } from "../types/master-data-release-notification";
const baseUrl = process.env.WEB_APP_REDIRECT_URI;

export const MasterDataReleaseNotification = ({
  added,
  modified,
  country,
  updateDate,
  name,
  version,
  rows,
}: MasterDataReleaseNotificationProps) => {
  const previewText = `Master data update for ${country}`;

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
        <Body className=" bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-giga-light-gray rounded my-10 mx-auto p-5 max-w-md">
            <Row className="bg-primary">
              <Column style={{ width: 40 }}>
                <Img
                  className="p-4"
                  width={40}
                  height={40}
                  src="https://storage.googleapis.com/giga-test-app-static-assets/GIGA_logo.png"
                />
              </Column>
              <Column>
                <Text className="text-white text-2xl">
                  <span className="font-light">giga</span>
                  <span className="font-bold">sync</span>
                </Text>
              </Column>
            </Row>

            <div className="p-6 mx-auto">
              <Text className="text-black text-sm leading-6">
                Hello {name},
              </Text>
              <Text className="text-black text-sm leading-6">
                The master data for <strong>{country}</strong> has been updated
                with the following details:
              </Text>
              <ul>
                <li>
                  Version: <strong>{version}</strong>
                </li>
                <li>
                  <strong>{modified}</strong> rows updated
                </li>
                <li>
                  <strong>{added}</strong> rows added
                </li>
                <li className="pt-4">
                  <strong>{rows}</strong> total rows in dataset
                </li>
              </ul>
              <Text className="text-black text-sm leading-6">
                To view the changes, please click the button below.
              </Text>

              <Section className="text-center my-8 ">
                <Button
                  className="bg-primary px-5 py-3 text-sm rounded font-semibold text-white no-underline text-center"
                  href={`${baseUrl}/check-file-uploads/[SOME_UPDATE_ID]`}
                >
                  View Report
                </Button>
              </Section>

              <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
              <Text className="text-giga-gray text-xs leading-6]">
                Master data updated at <strong>{updateDate}</strong>. This
                notification is sent automatically because you are assigned to
                the relevant country.
              </Text>
            </div>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

MasterDataReleaseNotification.PreviewProps = {
  added: 10,
  country: "Benin",
  modified: 20,
  name: "Alan Turing",
  updateDate: new Date().toLocaleString(undefined, {
    timeZoneName: "short",
  }),
  version: "1.0.0",
  rows: 30,
} as MasterDataReleaseNotificationProps;

export default MasterDataReleaseNotification;
