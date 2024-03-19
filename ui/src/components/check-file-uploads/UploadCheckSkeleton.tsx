import { Accordion, AccordionItem, SkeletonText } from "@carbon/react";

const UploadCheckSkeleton = () => (
  <div>
    <SkeletonText paragraph />
    <Accordion align="start">
      <AccordionItem disabled title="Summary" />
      <AccordionItem disabled title="Checks per column" />
      <AccordionItem disabled title="Checks for duplicate rows" />
      <AccordionItem disabled title="Checks based on geospatial data points" />
    </Accordion>
  </div>
);

export default UploadCheckSkeleton;
