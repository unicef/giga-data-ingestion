import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import tailwindConfig from "../styles/tailwind.config";
import { MasterDataReleaseNotificationProps } from "../types/master-data-release-notification";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const MasterDataReleaseNotification = ({
  added,
  modified,
  deleted,
  country,
  updateDate,
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
            <Header />

            <div className="p-6 mx-auto">
              <Text className="text-black text-sm leading-6">
                The School Master data for <strong>{country}</strong> has been
                updated with the following details:
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
                <li>
                  <strong>{deleted}</strong> rows deleted
                </li>
                <li className="pt-4">
                  <strong>{rows}</strong> total rows in dataset
                </li>
              </ul>

              <Footer>
                <>
                  School Master data updated at <strong>{updateDate}</strong>.
                  This notification is sent automatically because you are
                  assigned to the relevant country.
                </>
              </Footer>
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
  updateDate: new Date().toLocaleString(undefined, {
    timeZoneName: "short",
  }),
  version: 1,
  rows: 30,
} as MasterDataReleaseNotificationProps;

export default MasterDataReleaseNotification;
