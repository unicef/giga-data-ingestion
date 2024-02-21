import { Upload, WifiBridgeAlt } from "@carbon/icons-react";
import { Button, Column, FlexGrid, Heading } from "@carbon/react";
import { Link } from "@tanstack/react-router";

import homeBg from "@/assets/home-bg.jpg";
import { useStore } from "@/store.ts";

const { VITE_DATAHUB_URL: DATAHUB_URL } = import.meta.env;

export default function Landing() {
  const {
    user: { roles },
  } = useStore();

  const hasRoles = roles.length > 0;

  return (
    <div
      className="h-full bg-cover text-white"
      style={{
        backgroundImage: `url('${homeBg}')`,
      }}
    >
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
            <Button
              as={Link}
              to="/upload"
              className="gap-4"
              renderIcon={Upload}
              disabled={!hasRoles}
            >
              Upload File
            </Button>

            <Button
              as={Link}
              to="/check-file-uploads"
              className="gap-4"
              renderIcon={Upload}
            >
              Check File Uploads
            </Button>
            <Button
              as={Link}
              to="/ingest-api"
              className="gap-4"
              renderIcon={WifiBridgeAlt}
              disabled={!hasRoles}
            >
              Ingest API
            </Button>
          </div>

          {!hasRoles && (
            <p className="text-giga-red">
              You do not have permission to access this application. Please
              contact the system administrator to request access.
            </p>
          )}
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
