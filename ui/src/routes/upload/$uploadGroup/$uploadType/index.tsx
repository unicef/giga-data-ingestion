import { useState } from "react";
import { useForm } from "react-hook-form";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import {
  Button,
  ButtonSet,
  SelectItem,
  SkeletonPlaceholder,
  Stack,
} from "@carbon/react";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { api } from "@/api";
import { FileUploaderDropContainer } from "@/components/common/CarbonOverrides.tsx";
import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { PendingComponent } from "@/components/common/PendingComponent.tsx";
import { Select } from "@/components/forms/Select.tsx";
import {
  AcceptedFileTypes,
  AcceptedUnstructuredFileTypes,
  UPLOAD_MODE_OPTIONS,
} from "@/constants/upload.ts";
import { useStore } from "@/context/store";
import { sourceOptions } from "@/mocks/metadataFormValues.tsx";
import { HeaderDetector } from "@/utils/upload.ts";

export const Route = createFileRoute("/upload/$uploadGroup/$uploadType/")({
  component: Index,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
  beforeLoad: ({ context: { getState } }) => {
    const {
      uploadSliceActions: { resetUploadSliceState },
    } = getState();
    resetUploadSliceState();
  },
});

const validStructuredTypes = {
  "text/csv": AcceptedFileTypes.CSV,
  "application/vnd.ms-excel": AcceptedFileTypes.EXCEL_LEGACY,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    AcceptedFileTypes.EXCEL,
};

const validUnstructuredTypes = {
  "image/bmp": AcceptedUnstructuredFileTypes.BMP,
  "image/gif": AcceptedUnstructuredFileTypes.GIF,
  "image/jpeg": [
    AcceptedUnstructuredFileTypes.JPEG,
    AcceptedUnstructuredFileTypes.JPG,
  ],
  "image/png": AcceptedUnstructuredFileTypes.PNG,
  "image/tiff": [
    AcceptedUnstructuredFileTypes.TIF,
    AcceptedUnstructuredFileTypes.TIFF,
  ],
  "text/csv": AcceptedUnstructuredFileTypes.CSV, 
  "application/vnd.ms-excel": AcceptedUnstructuredFileTypes.EXCEL_LEGACY, 
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    AcceptedUnstructuredFileTypes.EXCEL, 
  "application/pdf": AcceptedUnstructuredFileTypes.PDF, 
  "application/msword": AcceptedUnstructuredFileTypes.DOC,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    AcceptedUnstructuredFileTypes.DOCX, 
};

export default function Index() {
  const { uploadType, uploadGroup } = Route.useParams();
  const isCoverage = uploadType === "coverage";
  const isGeolocation = uploadType === "geolocation";

  const [isParsing, setIsParsing] = useState(false);

  const [parsingError, setParsingError] = useState("");
  const navigate = useNavigate({ from: Route.fullPath });
  const hasParsingError = !!parsingError;
  const isUnstructured =
    uploadGroup === "other" && uploadType === "unstructured";

  const validTypes = isUnstructured
    ? validUnstructuredTypes
    : validStructuredTypes;
  const {
    uploadSlice,
    uploadSliceActions: {
      setStepIndex,
      resetUploadSliceState,
      setUploadSliceState,
      setSource,
      setMode,
      setDetectedColumns,
      setColumnMapping,
    },
  } = useStore();
  const { file, source: storeSource, mode: storeMode } = uploadSlice;
  const hasUploadedFile = file != null;

  const { register, watch } = useForm<{
    source: string | null;
    mode: typeof storeMode;
  }>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      source: storeSource,
      mode: storeMode,
    },
  });

  const source = watch("source");
  const mode = watch("mode");

  const metaschemaName = isCoverage
    ? `coverage_${source}`
    : `school_${uploadType}`;

  const { data: schemaQuery, isFetching: isSchemaFetching } = useQuery({
    queryFn: () => api.schema.get(metaschemaName, mode === "Update"),
    queryKey: ["schema", metaschemaName, mode, false],
    enabled: isCoverage ? !!source : isGeolocation ? !!mode : !isUnstructured,
  });

  const schema = schemaQuery?.data ?? [];

  const handleProceedToNextStep = () => {
    if (file) {
      setSource(source ?? null);
      setMode(mode);
      setStepIndex(1);
    }
    void navigate({ to: isUnstructured ? "./metadata" : "./column-mapping" });
  };

  const isProceedDisabled =
    !hasUploadedFile ||
    (isCoverage && !source) ||
    (isGeolocation && !mode) ||
    isSchemaFetching ||
    isParsing ||
    hasParsingError;
  const isSchemaLoading = !(
    (!isCoverage && !isSchemaFetching) ||
    (!isGeolocation && !isSchemaFetching) ||
    (isCoverage && !!source && !isSchemaFetching) ||
    (isGeolocation && !!mode && !isSchemaFetching)
  );
  const shouldShowSkeleton =
    (!isCoverage && isSchemaLoading) ||
    (isCoverage && !!source) ||
    (isGeolocation && !!mode);

  function handleOnAddFiles(addedFiles: File[]) {
    const file = addedFiles.at(0) ?? null;
    if (!file) return;

    setParsingError("");
    setIsParsing(true);

    const detector = new HeaderDetector({
      file,
      schema,
      setIsParsing: setIsParsing,
      setError: setParsingError,
      setColumnMapping,
      setDetectedColumns,
      type: validTypes[file.type as keyof typeof validTypes],
    });
    detector.validateFileSize();
    detector.detect();

    setUploadSliceState({
      uploadSlice: {
        ...uploadSlice,
        file: file,
        timeStamp: new Date(),
      },
    });
  }

  return (
    <Stack gap={10}>
      {isCoverage && (
        <Select
          id="source"
          labelText="Source"
          placeholder="Source"
          className="w-1/4"
          {...register("source", { required: true })}
        >
          <SelectItem value="" text="" />
          {sourceOptions.map(option => (
            <SelectItem
              key={option.value}
              text={option.label}
              value={option.value}
            />
          ))}
        </Select>
      )}

      {uploadType === "geolocation" && (
        <Select
          id="mode"
          labelText="Are you updating existing schools or uploading data for new schools?"
          placeholder="Select an option..."
          className="w-1/4"
          {...register("mode", { required: true })}
        >
          <SelectItem value="" text="" />
          {UPLOAD_MODE_OPTIONS.map(option => (
            <SelectItem key={option} text={option} value={option} />
          ))}
        </Select>
      )}

      {isSchemaLoading ? (
        shouldShowSkeleton ? (
          <SkeletonPlaceholder />
        ) : null
      ) : (
        <div className="flex w-1/4 flex-col gap-4">
          <FileUploaderDropContainer
            accept={Object.keys(validTypes)}
            name="file"
            labelText={
              hasUploadedFile ? file.name : "Click or drag a file to upload"
            }
            onAddFiles={(_, { addedFiles }: { addedFiles: File[] }) =>
              handleOnAddFiles(addedFiles)
            }
          />
          <p>
            File formats: {Object.values(validTypes).flat().join(", ")} up to
            10MB
          </p>
          {hasParsingError && <p className="text-giga-red">{parsingError}</p>}
        </div>
      )}

      <ButtonSet className="w-full">
        <Button
          kind="secondary"
          as={Link}
          to="/upload"
          onClick={resetUploadSliceState}
          className="w-full"
          renderIcon={ArrowLeft}
          isExpressive
        >
          Cancel
        </Button>
        <Button
          disabled={isProceedDisabled}
          onClick={handleProceedToNextStep}
          className="w-full"
          renderIcon={ArrowRight}
          isExpressive
        >
          Proceed
        </Button>
      </ButtonSet>
    </Stack>
  );
}
