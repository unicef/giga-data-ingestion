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
import { Link, createFileRoute } from "@tanstack/react-router";

import { api } from "@/api";
import { FileUploaderDropContainer } from "@/components/common/CarbonOverrides.tsx";
import { Select } from "@/components/forms/Select.tsx";
import { AcceptedFileTypes } from "@/constants/upload.ts";
import { useStore } from "@/context/store";
import { sourceOptions } from "@/mocks/metadataFormValues.tsx";
import { HeaderDetector } from "@/utils/upload.ts";

export const Route = createFileRoute("/upload/$uploadGroup/$uploadType/")({
  component: Index,
});

const validTypes = {
  "text/csv": AcceptedFileTypes.CSV,
  "application/vnd.ms-excel": AcceptedFileTypes.EXCEL_LEGACY,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    AcceptedFileTypes.EXCEL,
};

export default function Index() {
  const { uploadType } = Route.useParams();
  const isCoverage = uploadType === "coverage";
  const isUnstructured = uploadType === "unstructured";

  const [isParsing, setIsParsing] = useState(false);

  const [parsingError, setParsingError] = useState("");
  const hasParsingError = !!parsingError;

  const {
    uploadSlice,
    uploadSliceActions: {
      incrementStepIndex,
      resetUploadSliceState,
      setUploadSliceState,
      setSource,
      setDetectedColumns,
      setColumnMapping,
    },
  } = useStore();
  const { file, source: storeSource } = uploadSlice;
  const hasUploadedFile = file != null;

  const { register, watch } = useForm<{ source: string | null }>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      source: storeSource,
    },
  });

  const source = watch("source");

  const metaschemaName =
    uploadType === "coverage" ? `coverage_${source}` : `school_${uploadType}`;

  const { data: schemaQuery, isFetching: isSchemaFetching } = useQuery({
    queryFn: () => api.schema.get(metaschemaName),
    queryKey: ["schema", metaschemaName],
    enabled: isCoverage ? !!source && !isUnstructured : true,
  });
  const schema = schemaQuery?.data ?? [];

  const handleProceedToNextStep = () => {
    if (file) {
      setSource(source ?? null);
      incrementStepIndex();
    }
  };

  const isProceedDisabled =
    !hasUploadedFile ||
    (isCoverage && !source) ||
    isSchemaFetching ||
    isParsing ||
    hasParsingError;
  const isSchemaLoading = !(
    (!isCoverage && !isSchemaFetching) ||
    (isCoverage && !!source && !isSchemaFetching)
  );
  const shouldShowSkeleton =
    (!isCoverage && isSchemaLoading) || (isCoverage && !!source);

  function handleOnAddFiles(addedFiles: File[]) {
    const file = addedFiles.at(0) ?? null;
    if (!file) return;

    setParsingError("");
    setIsParsing(true);

    const detector = new HeaderDetector({
      file,
      schema,
      setIsLoading: setIsParsing,
      setError: setParsingError,
      setColumnMapping,
      setDetectedColumns,
      type: validTypes[file.type as keyof typeof validTypes],
    });
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

      {isSchemaLoading ? (
        shouldShowSkeleton ? (
          <SkeletonPlaceholder />
        ) : null
      ) : (
        <div className="w-1/4">
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
          <p>File formats: {Object.values(validTypes).join(", ")} up to 10MB</p>
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
          as={Link}
          to={isUnstructured ? "./metadata" : "./column-mapping"}
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
