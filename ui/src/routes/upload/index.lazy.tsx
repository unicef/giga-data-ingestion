import { Add } from "@carbon/icons-react";
import { Button, Column, Grid, Heading, Section, Stack } from "@carbon/react";
import { Link, createLazyFileRoute } from "@tanstack/react-router";

import UploadsTable from "@/components/check-file-uploads/UploadsTable.tsx";

export const Route = createLazyFileRoute("/upload/")({
  component: () => (
    <Section>
      <Section>
        <Stack gap={4}>
          <Heading>What will you be uploading today?</Heading>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </p>
          <Grid>
            <Column lg={4}>
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
                isExpressive
              >
                School geolocation
              </Button>
            </Column>
            <Column lg={4}>
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
                isExpressive
              >
                School coverage
              </Button>
            </Column>
            {/* TODO: Scope this out */}
            {/*<Column lg={4}>*/}
            {/*  <Button*/}
            {/*    as={Link}*/}
            {/*    to="/upload/$uploadGroup/$uploadType"*/}
            {/*    params={{*/}
            {/*      uploadGroup: "other",*/}
            {/*      uploadType: "unstructured",*/}
            {/*    }}*/}
            {/*    className="w-full"*/}
            {/*    size="xl"*/}
            {/*    renderIcon={Add}*/}
            {/*  >*/}
            {/*    Unstructured dataset*/}
            {/*  </Button>*/}
            {/*</Column>*/}
          </Grid>

          <UploadsTable />
        </Stack>
      </Section>
    </Section>
  ),
});
