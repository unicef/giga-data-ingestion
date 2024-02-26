import { useEffect } from "react";

import { Add } from "@carbon/icons-react";
import { Button, Column, Grid, Heading, Section, Stack } from "@carbon/react";
import { Link, createFileRoute } from "@tanstack/react-router";

import UploadsTable from "@/components/check-file-uploads/UploadsTable.tsx";
import UploadBreadcrumbs from "@/components/upload/UploadBreadcrumbs.tsx";
import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView.tsx";
import { useStore } from "@/store.ts";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { resetUploadState } = useStore();

  useEffect(() => {
    return () => {
      resetUploadState();
    };
  }, [resetUploadState]);

  return (
    <AuthenticatedRBACView>
      <Grid>
        <Column lg={16} className="py-6">
          <Stack gap={6}>
            <UploadBreadcrumbs />

            <Section>
              <Section>
                <Stack gap={4}>
                  <Heading>What will you be uploading today?</Heading>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                    ullamco laboris nisi ut aliquip ex ea commodo consequat.
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
          </Stack>
        </Column>
      </Grid>
    </AuthenticatedRBACView>
  );
}
