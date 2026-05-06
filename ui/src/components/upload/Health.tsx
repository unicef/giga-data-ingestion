import {
  health,
  healthMetadataDatasetSection,
  healthMetadataNationalSection,
} from "@/constants/metadata";

import {
  BaseUploadMetadataForm,
  UploadMetadataFormProps,
} from "@/components/upload/uploadMetadataFormBase.tsx";

const HEALTH_INTRO = {
  title: "Add health metadata",
  paragraphs: [
    "Provide context for this health dataset: who compiled or uploaded it, what period it covers, and how it was collected.",
    "Required fields include country, health dataset description, focal point (person uploading or responsible), data owner, and the year the data refers to.",
  ],
};

export function Health(props: UploadMetadataFormProps) {
  return (
    <BaseUploadMetadataForm
      {...props}
      mapping={health}
      datasetSectionHeading={healthMetadataDatasetSection}
      nationalPracticesHeading={healthMetadataNationalSection}
      introTitle={HEALTH_INTRO.title}
      introParagraphs={HEALTH_INTRO.paragraphs}
    />
  );
}
