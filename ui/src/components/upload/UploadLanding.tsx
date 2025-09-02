import { useState } from "react";

import { Add } from "@carbon/icons-react";
import { Button, Heading, Section, Stack } from "@carbon/react";
import { Link } from "@tanstack/react-router";

import UploadsTable from "@/components/check-file-uploads/UploadsTable.tsx";
import useRoles from "@/hooks/useRoles";
import { cn } from "@/lib/utils.ts";
import { getDataPrivacyDocument } from "@/utils/download.ts";

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
  const [isPrivacyLoading, setIsPrivacyLoading] = useState(false);
  const { hasCoverage, hasGeolocation, isAdmin } = useRoles();

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
                <a
                  onClick={async () => {
                    // It's ridiculous how there's no native way of disabling
                    // HTML anchors. We could add the pointer-events-none class
                    // but that disables the loading cursor animation.
                    if (isPrivacyLoading) return;

                    setIsPrivacyLoading(true);
                    await getDataPrivacyDocument();
                    setIsPrivacyLoading(false);
                  }}
                  className={cn("cursor-pointer", {
                    "cursor-wait": isPrivacyLoading,
                  })}
                >
                  data privacy and sharing framework
                </a>{" "}
                to answer any questions you may have regarding what data can be
                shared and in which context.
              </p>
            </div>
            <div className="grid grid-cols-4">
              {(hasGeolocation || isAdmin) && (
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
              )}
              {(hasCoverage || isAdmin) && (
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
              )}
              <Button
                as={Link}
                to="/upload/$uploadGroup/options/$uploadType"
                params={{
                  uploadGroup: "other",
                  uploadType: "schemaless",
                }}
                className="w-full"
                size="xl"
                renderIcon={Add}
              >
                Schemaless dataset
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
