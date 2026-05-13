import { useState } from "react";

import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@carbon/react";

import { Check } from "@/types/upload";

import DataQualityChecks from "./ColumnChecks";

interface DataCheckItemProps {
  data: Check[];
  title?: string;
  uploadId: string;
  hasDownloadButton?: boolean;
}

const DataCheckItem = ({ data, title }: DataCheckItemProps) => {
  const [selectedTab, setSelectedTab] = useState(0);
  return (
    <Tabs
      selectedIndex={selectedTab}
      onChange={({ selectedIndex }: { selectedIndex: number }) =>
        setSelectedTab(selectedIndex)
      }
    >
      <TabList aria-label="Data Quality Check Tabs">
        <Tab>{title}</Tab>
      </TabList>

      <TabPanels>
        <TabPanel>
          <DataQualityChecks data={data} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

export default DataCheckItem;
