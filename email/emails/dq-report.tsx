import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import tailwindConfig from "../styles/tailwind.config";
import { DataQualityReportEmailProps } from "../types/dq-report";
import * as React from "react";

const DataQualityReport = ({ name }: DataQualityReportEmailProps) => {
  return (
    <Html>
      <Tailwind config={tailwindConfig}>
        <Head>
          <title>Gigasync Data Quality Report</title>

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
        <Body className="font-sans">
          <Container>
            <Heading className="text-primary text-xl">
              Hello, Gigachad {name}!
            </Heading>
            <Text>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </Text>
            <Button
              className="bg-primary p-4 text-white"
              href="http://localhost:3000"
              rel="noopener noreferrer"
              target="_blank"
            >
              Go to Ingestion Portal
            </Button>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

DataQualityReport.PreviewProps = {
  name: "John Doe",
} satisfies DataQualityReportEmailProps;

export default DataQualityReport;
