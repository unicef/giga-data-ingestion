import { Upload, WifiBridgeAlt } from "@carbon/icons-react";
import { Button, Column, FlexGrid, Heading } from "@carbon/react";
import { Link } from "@tanstack/react-router";

import { useStore } from "@/store.ts";

const { VITE_DATAHUB_URL: DATAHUB_URL } = import.meta.env;

export default function Landing() {
  const { featureFlags } = useStore();

  return (
    <div className="h-full bg-[url(/home-bg.jpg)] bg-cover text-white">
      <div className="flex h-full w-full flex-col items-center justify-center backdrop-brightness-50">
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col">
            <Heading>Upload</Heading>
            <p>
              Easily upload quality datasets to help connect every school to the
              internet.
            </p>
          </div>
          <div className="flex gap-8">
            {featureFlags.uploadFilePage && (
              <Button
                as={Link}
                to="/upload"
                className="gap-4"
                renderIcon={Upload}
              >
                Upload File
              </Button>
            )}
            {featureFlags.ingestApiPage && (
              <Button
                as={Link}
                to="/ingest-api"
                className="gap-4"
                renderIcon={WifiBridgeAlt}
              >
                Ingest API
              </Button>
            )}
          </div>
        </div>

        <FlexGrid className="absolute bottom-0 flex flex-row gap-24 py-8">
          <Column>
            <Button
              as="a"
              href="https://giga.global"
              target="_blank"
              rel="noopener noreferrer"
            >
              Giga Homepage
            </Button>
          </Column>
          <Column>
            <Button
              as="a"
              href="https://projectconnect.unicef.org/map"
              target="_blank"
              rel="noopener noreferrer"
            >
              Giga Maps
            </Button>
          </Column>
          <Column>
            <Button
              as="a"
              href={DATAHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              DataHub
            </Button>
          </Column>
        </FlexGrid>
      </div>
    </div>
  );
}
