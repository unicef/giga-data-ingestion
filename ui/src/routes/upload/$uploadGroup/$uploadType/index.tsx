import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import {
  Button,
  ButtonSet,
  FileUploaderItem,
  SelectItem,
  SkeletonPlaceholder,
  Stack,
} from "@carbon/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { api } from "@/api";
import { FileUploaderDropContainer } from "@/components/common/CarbonOverrides.tsx";
import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { PendingComponent } from "@/components/common/PendingComponent.tsx";
import { Select } from "@/components/forms/Select.tsx";
import {
  AcceptedFileTypes,
  AcceptedUnstructuredFileTypes,
  MAX_UPLOAD_FILE_SIZE_MB,
} from "@/constants/upload.ts";
import { useStore } from "@/context/store";
import useRoles from "@/hooks/useRoles.ts";
import { sourceOptions } from "@/mocks/metadataFormValues.tsx";
import { capitalizeFirstLetter } from "@/utils/string.ts";
import { HeaderDetector } from "@/utils/upload.ts";

export const Route = createFileRoute("/upload/$uploadGroup/$uploadType/")({
  component: Index,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
  // beforeLoad: ({ context: { getState } }) => {
  //   const {
  //     uploadSliceActions: { resetUploadSliceState },
  //   } = getState();
  //   resetUploadSliceState();
  // },
});

const validStructuredTypes = {
  "text/csv": AcceptedFileTypes.CSV,
  "application/vnd.ms-excel": AcceptedFileTypes.EXCEL_LEGACY,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    AcceptedFileTypes.EXCEL,
};

const validCustomStructuredTypes = {
  "text/csv": AcceptedFileTypes.CSV,
  "application/csv": AcceptedFileTypes.CSV,
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
  "application/csv": AcceptedUnstructuredFileTypes.CSV,
  "application/vnd.ms-excel": AcceptedUnstructuredFileTypes.XLS,
  "application/x-ole-storage": AcceptedUnstructuredFileTypes.XLS,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    AcceptedUnstructuredFileTypes.XLSX,
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
  const isStructured = uploadGroup === "other" && uploadType === "structured";
  const shouldSelectCountry = !isUnstructured && !isStructured;

  const validTypes = isUnstructured
    ? validUnstructuredTypes
    : isStructured
    ? validCustomStructuredTypes
    : validStructuredTypes;
  const {
    uploadSlice,
    uploadSliceActions: {
      setStepIndex,
      resetUploadSliceState,
      setUploadSliceState,
      setCountry,
      setSource,
      setDetectedColumns,
      setColumnMapping,
      setUploadDate,
      setFile,
      setTimeStamp,
    },
  } = useStore();

  const { country: storeCountry, file, source: storeSource } = uploadSlice;
  const hasUploadedFile = file != null;
  const { countryDatasets, isPrivileged } = useRoles();

  const uploadStructuredFile = useMutation({
    mutationFn: api.uploads.upload_structured,
  });

  const { register, watch } = useForm<{
    country: string;
    source: string | null;
  }>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      country: storeCountry,
      source: storeSource,
    },
  });

  const country = watch("country");
  const source = watch("source");

  const { data: allGroupsQuery } = useQuery({
    queryKey: ["groups"],
    queryFn: api.groups.list,
    enabled: shouldSelectCountry && isPrivileged,
  });

  const userCountryNames = useMemo(
    () => countryDatasets[`School ${capitalizeFirstLetter(uploadType)}`] ?? [],
    [countryDatasets, uploadType],
  );

  const allCountryNames = useMemo(() => {
    const allGroups = allGroupsQuery?.data ?? [];
    const allGroupNames = allGroups.map(group => group.name);
    return [
      ...new Set(
        allGroupNames
          .map(name => name.split("-School"))
          .filter(split => split.length > 1)
          .map(split => split[0]),
      ),
    ];
  }, [allGroupsQuery?.data]);

  const countryOptions = isPrivileged ? allCountryNames : userCountryNames;

  const metaschemaName = isCoverage
    ? `coverage_${source}`
    : `school_${uploadType}`;

  const { data: schemaQuery, isFetching: isSchemaFetching } = useQuery({
    queryFn: () => api.schema.get(metaschemaName),
    queryKey: ["schema", metaschemaName, false],
    enabled: isCoverage
      ? !!source
      : isGeolocation
      ? true
      : !isUnstructured && !isStructured,
  });

  const schema = useMemo(() => schemaQuery?.data ?? [], [schemaQuery?.data]);

  useEffect(() => {
    if (schema.length && file) {
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
    }
  }, [schema, file, setColumnMapping, setDetectedColumns, validTypes]);

  const handleProceedToNextStep = async () => {
    if (isStructured) {
      // For structured datasets, upload directly without metadata
      if (file) {
        setSource(source ?? null);
      }

      try {
        const body = {
          country: "Global Dataset",
          file: file!,
          source: source ?? null,
          metadata: JSON.stringify({
            dataset_type: "structured",
            upload_timestamp: new Date().toISOString(),
          }),
        };

        await uploadStructuredFile.mutateAsync(body);
        setUploadDate(uploadSlice.timeStamp);
        setStepIndex(2); // Step 2 for structured datasets (Submit step)
        void navigate({ to: "./success" });
      } catch (error) {
        console.error("Upload failed:", error);
        // Handle error appropriately - don't navigate on error
        return;
      }
    } else {
      if (file) {
        if (shouldSelectCountry) {
          setCountry(country);
        }
        setSource(source ?? null);
        setStepIndex(1);
      }
      void navigate({ to: isUnstructured ? "./metadata" : "./column-mapping" });
    }
  };

  const isProceedDisabled =
    !hasUploadedFile ||
    (shouldSelectCountry && !country) ||
    (isCoverage && !source) ||
    (!isStructured && (isSchemaFetching || isParsing || hasParsingError));
  const isSchemaLoading = !(
    (!isCoverage && !isSchemaFetching) ||
    (!isGeolocation && !isSchemaFetching) ||
    (isCoverage && !!source && !isSchemaFetching) ||
    (isGeolocation && !isSchemaFetching)
  );
  const shouldShowSkeleton =
    (!isCoverage && isSchemaLoading) ||
    (isCoverage && !!source) ||
    isGeolocation;

  function handleRemoveFile() {
    setFile(null);
    setTimeStamp(null);
    setDetectedColumns([]);
    setColumnMapping({});
    setParsingError("");
    setIsParsing(false);
  }

  function handleOnAddFiles(addedFiles: File[]) {
    const file = addedFiles.at(0) ?? null;
    if (!file) return;

    setParsingError("");
    setIsParsing(true);

    if (isStructured) {
      // For structured datasets, just validate file size and set the file
      if (file.size > MAX_UPLOAD_FILE_SIZE_MB * 1024 * 1024) {
        setParsingError(
          `File size exceeds ${MAX_UPLOAD_FILE_SIZE_MB} MB limit`,
        );
        setIsParsing(false);
        return;
      }

      setUploadSliceState({
        uploadSlice: {
          ...uploadSlice,
          fuzzyCorrections: [],
          fuzzyValidationRequestKey: null,
          fuzzyValidationResult: null,
          file: file,
          timeStamp: new Date(),
        },
      });
      setIsParsing(false);
    } else {
      // For other datasets, use HeaderDetector
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
          fuzzyCorrections: [],
          fuzzyValidationRequestKey: null,
          fuzzyValidationResult: null,
          file: file,
          timeStamp: new Date(),
        },
      });
    }
  }

  return (
    <Stack gap={10}>
      {shouldSelectCountry && (
        <Select
          id="country"
          labelText="Country"
          placeholder="Country"
          className="w-1/2"
          {...register("country", { required: true })}
        >
          <SelectItem value="" text="Select country" />
          {countryOptions.map(option => (
            <SelectItem key={option} text={option} value={option} />
          ))}
        </Select>
      )}

      {isCoverage && (
        <Select
          id="source"
          labelText="Source"
          placeholder="Source"
          className="w-1/2"
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

      <div className="flex w-1/2 flex-col gap-4">
        {isSchemaLoading ? (
          shouldShowSkeleton ? (
            <SkeletonPlaceholder />
          ) : null
        ) : (
          <div className="flex w-full flex-col gap-4">
            <h2 className="font-ibmplex text-base font-semibold">
              Upload file
            </h2>
            <p className="-mt-1 font-ibmplex text-sm font-normal text-giga-gray">
              File formats:{" "}
              {[...new Set(Object.values(validTypes).flat())].join(", ")} up to
              {MAX_UPLOAD_FILE_SIZE_MB}MB
            </p>
            <div className="h-[78px] w-full">
              {hasUploadedFile && file ? (
                <FileUploaderItem
                  name={file.name}
                  status="edit"
                  onDelete={handleRemoveFile}
                  iconDescription="Remove file"
                  aria-label={`Remove ${file.name}`}
                />
              ) : (
                <FileUploaderDropContainer
                  accept={Object.keys(validTypes)}
                  name="file"
                  labelText="Click or drag a file to upload"
                  onAddFiles={(_, { addedFiles }: { addedFiles: File[] }) =>
                    handleOnAddFiles(addedFiles)
                  }
                />
              )}
            </div>

            {hasParsingError && <p className="text-giga-red">{parsingError}</p>}
          </div>
        )}
      </div>

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
