import { useState } from "react";

import { Add, Filter } from "@carbon/icons-react";
import {
  Button,
  Heading,
  Section,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@carbon/react";
import { Link } from "@tanstack/react-router";

import UploadsTable from "@/components/check-file-uploads/UploadsTable.tsx";
import FilterModal, {
  EMPTY_FILTERS,
  UploadFilters,
} from "@/components/upload/FilterModal.tsx";
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
  const [selectedTab, setSelectedTab] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] =
    useState<UploadFilters>(EMPTY_FILTERS);
  const activeFilterCount = Object.values(activeFilters).filter(
    v => v !== "",
  ).length;
  const { hasCoverage, hasGeolocation, isAdmin } = useRoles();

  // Tab 0 = Geolocation (source gigasync), 1 = API (source api),
  // 2 = Coverage (dataset coverage), 3 = Schemaless (dataset structured)
  const tabFilter = (() => {
    switch (selectedTab) {
      case 0:
        return { source: null, dataset: "geolocation" as const };
      case 1:
        return { source: "api" as const, dataset: "geolocation" as const };
      case 2:
        return { source: null, dataset: "coverage" as const };
      case 3:
        return { source: null, dataset: "structured" as const };
      default:
        return { source: null, dataset: null };
    }
  })();

  const handleTabChange = ({ selectedIndex }: { selectedIndex: number }) => {
    setSelectedTab(selectedIndex);
    // Reset to page 1 when switching tabs
    if (props.page !== 1) {
      props.handlePaginationChange({ page: 1, pageSize: props.pageSize });
    }
  };

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

          <Tabs selectedIndex={selectedTab} onChange={handleTabChange}>
            <div className="flex items-center">
              <TabList
                aria-label="File Uploads Tabs"
                fullWidth
                className="w-full"
              >
                <Tab>Geolocation</Tab>
                <Tab>API</Tab>
                <Tab>Coverage</Tab>
                <Tab>Schemaless</Tab>
              </TabList>
              <Button
                kind="tertiary"
                size="sm"
                renderIcon={Filter}
                onClick={() => setIsFilterOpen(true)}
                className="shrink-0"
              >
                {`Filters${
                  activeFilterCount > 0 ? ` (${activeFilterCount})` : ""
                }`}
              </Button>
            </div>

            <TabPanels>
              <TabPanel className="p-0">
                <UploadsTable
                  {...props}
                  source={tabFilter.source}
                  dataset={activeFilters.dataset || tabFilter.dataset}
                  uploaderEmail={activeFilters.uploaderEmail}
                  country={activeFilters.country}
                  dqStatus={activeFilters.dqStatus}
                />
              </TabPanel>
              <TabPanel className="p-0">
                <UploadsTable
                  {...props}
                  source={tabFilter.source}
                  dataset={activeFilters.dataset || tabFilter.dataset}
                  uploaderEmail={activeFilters.uploaderEmail}
                  country={activeFilters.country}
                  dqStatus={activeFilters.dqStatus}
                />
              </TabPanel>
              <TabPanel className="p-0">
                <UploadsTable
                  {...props}
                  source={tabFilter.source}
                  dataset={activeFilters.dataset || tabFilter.dataset}
                  uploaderEmail={activeFilters.uploaderEmail}
                  country={activeFilters.country}
                  dqStatus={activeFilters.dqStatus}
                />
              </TabPanel>
              <TabPanel className="p-0">
                <UploadsTable
                  {...props}
                  source={tabFilter.source}
                  dataset={activeFilters.dataset || tabFilter.dataset}
                  uploaderEmail={activeFilters.uploaderEmail}
                  country={activeFilters.country}
                  dqStatus={activeFilters.dqStatus}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>

          <FilterModal
            open={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            onApply={setActiveFilters}
            initialFilters={activeFilters}
          />
        </Stack>
      </Section>
    </Section>
  );
}

export default UploadLanding;
