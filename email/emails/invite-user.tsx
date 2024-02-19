import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

import tailwindConfig from "../styles/tailwind.config";
import { InviteUserProps } from "../types/invite-user";

const baseUrl = process.env.WEB_APP_URL;

export const InviteUserEmail = ({
  displayName,
  email,
  groups,
  temporaryPassword,
}: InviteUserProps) => {
  const previewText = "Welcome to Giga Sync";

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
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="border-gray-4 mx-auto my-8 max-w-[512px] border border-solid p-6">
            <Heading className="mx-0 my-[30px] p-0 text-center font-normal">
              Welcome to <strong>Giga Sync</strong>
            </Heading>
            <Text>Hello {displayName},</Text>
            <Text>
              You have been invited to <strong>Giga Sync</strong> with the
              following roles:
              <ul>
                {groups.map(group => (
                  <li key={group}>
                    <Text>{group}</Text>
                  </li>
                ))}
              </ul>
            </Text>
            <Text>
              Your temporary password is: <strong>{temporaryPassword}</strong>
            </Text>
            <Text>
              Login using the link below. You will be prompted to change your
              password:
            </Text>
            <Section className="my-8 text-center">
              <Button
                className="bg-primary px-6 py-4 text-center font-semibold text-white no-underline"
                href={baseUrl}
              >
                Go to website
              </Button>
            </Section>
            <Text>
              or copy and paste this URL into your browser:
              <br />
              <Link href={baseUrl} className="text-primary">
                {baseUrl}
              </Link>
            </Text>
            <Hr className="border-gray-4 mx-0 my-6 w-full border border-solid" />
            <Text className="text-gray-4 text-xs">
              This invitation was intended for{" "}
              <Link href={`mailto:${email}`} className="text-black">
                {displayName}
              </Link>
              . If you were not expecting this invitation, please disregard and
              discard this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

InviteUserEmail.PreviewProps = {
  displayName: "Giga Chad",
  email: "gigachad@example.com",
  groups: [
    "Admin",
    "Philippines-School Coverage",
    "Philippines-School Geolocation",
  ],
  temporaryPassword: "adobo24601",
} as InviteUserProps;

export default InviteUserEmail;
