import { Add } from "@carbon/icons-react";
import {
  Button,
  Link as CarbonLink,
  Heading,
  Section,
  Stack,
} from "@carbon/react";
import { Link } from "@tanstack/react-router";

import UploadsTable from "@/components/check-file-uploads/UploadsTable.tsx";

interface UploadLandingProps {
  page: number;
  pageSize: number;
  handlePaginationChange: ({
    page,
    pageSize,
  }: {
    page: number;
    pageSize: number;
  }) => void;
}

function UploadLanding(props: UploadLandingProps) {
  return (
    <Section>
      <Section>
        <Stack gap={8}>
          <Stack gap={4}>
            <Heading>What will you be uploading today?</Heading>
            <div>
              <p>
                Giga is an international project, focused on building the
                world's largest, most comprehensive database of schools mapped
                around the world. It relies on collaboration and data
                contributions from a number of sources, such as Governments,
                Internet Service Providers (ISPs), Ministries of Education and
                private companies. As such, your contributions are highly valued
                and essential to us achieving our mission of connecting every
                school to the internet by 2030.
              </p>
              <p>
                Please review our{" "}
                <CarbonLink href="https://unicef.sharepoint.com/teams/OOI/DocumentLibrary1/Forms/AllItems.aspx?id=%2Fteams%2FOOI%2FDocumentLibrary1%2FGiga%2F004%20Country%20support%2F%5FGlobal%20%2D%20Country%20info%20pack%2F08%2E%20Giga%20Data%20Sharing%20Framework%2FGiga%20Data%20Sharing%20Framework%5FENG%5FJan%5F2024%5FFinal%2Epdf&viewid=8a9966f4%2De600%2D450e%2Daa6d%2D71ab396305cf&parent=%2Fteams%2FOOI%2FDocumentLibrary1%2FGiga%2F004%20Country%20support%2F%5FGlobal%20%2D%20Country%20info%20pack%2F08%2E%20Giga%20Data%20Sharing%20Framework">
                  data privacy and sharing framework
                </CarbonLink>{" "}
                to answer any questions you may have regarding what data can be
                shared and in which context.
              </p>
            </div>
            <div className="grid grid-cols-4">
              <Button
                as={Link}
                to="/upload/$uploadGroup/$uploadType"
                params={{
                  uploadGroup: "school-data",
                  uploadType: "geolocation",
                }}
                className="w-full"
                size="xl"
                renderIcon={Add}
              >
                School geolocation
              </Button>
              <Button
                as={Link}
                to="/upload/$uploadGroup/$uploadType"
                params={{
                  uploadGroup: "school-data",
                  uploadType: "coverage",
                }}
                className="w-full"
                size="xl"
                renderIcon={Add}
              >
                School coverage
              </Button>
              <Button
                as={Link}
                to="/upload/$uploadGroup/$uploadType"
                params={{
                  uploadGroup: "other",
                  uploadType: "unstructured",
                }}
                className="w-full"
                size="xl"
                renderIcon={Add}
              >
                Unstructured dataset
              </Button>
            </div>
          </Stack>

          <UploadsTable {...props} />
        </Stack>
      </Section>
    </Section>
  );
}

export default UploadLanding;
