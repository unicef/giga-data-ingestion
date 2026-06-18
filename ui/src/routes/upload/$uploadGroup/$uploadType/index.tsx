import { useEffect, useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

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
import { Health } from "@/components/upload/Health.tsx";
import type { MetadataForm } from "@/components/upload/MetadataInputs.tsx";
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from "@/constants/pagination.ts";
import {
  AcceptedFileTypes,
  AcceptedUnstructuredFileTypes,
  MAX_UPLOAD_FILE_SIZE_BYTES,
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
  "application/csv": AcceptedFileTypes.CSV,
  "application/vnd.ms-excel": AcceptedFileTypes.EXCEL_LEGACY,
  "application/x-ole-storage": AcceptedFileTypes.EXCEL_LEGACY,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    AcceptedFileTypes.EXCEL,
};

const validCustomStructuredTypes = {
  "text/csv": AcceptedFileTypes.CSV,
  "application/csv": AcceptedFileTypes.CSV,
};

const validHealthCsvTypes = {
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

type ValidFileTypes = Record<string, string | string[]>;

function getFileExtension(file: File) {
  const extensionIndex = file.name.lastIndexOf(".");
  return extensionIndex === -1
    ? ""
    : file.name.slice(extensionIndex).toLowerCase();
}

function getAllowedExtensions(validTypes: ValidFileTypes) {
  return [...new Set(Object.values(validTypes).flat())];
}

function getAcceptedFileType(file: File, validTypes: ValidFileTypes) {
  const fileExtension = getFileExtension(file);

  return getAllowedExtensions(validTypes).find(
    extension => extension.toLowerCase() === fileExtension,
  );
}

function getFileValidationError(file: File, validTypes: ValidFileTypes) {
  const allowedExtensions = getAllowedExtensions(validTypes);
  const fileExtension = getFileExtension(file);

  if (!allowedExtensions.includes(fileExtension)) {
    return `Unsupported file type. Please upload ${allowedExtensions.join(
      " or ",
    )} files only.`;
  }

  if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
    return `File size exceeds ${MAX_UPLOAD_FILE_SIZE_MB} MB limit`;
  }

  return "";
}

export default function Index() {
  const { uploadType, uploadGroup } = Route.useParams();
  const isCoverage = uploadType === "coverage";
  const isGeolocation = uploadType === "geolocation";

  const [healthStep, setHealthStep] = useState(0);
  const [healthFileError, setHealthFileError] = useState("");

  const [isParsing, setIsParsing] = useState(false);

  const [parsingError, setParsingError] = useState("");
  const navigate = useNavigate({ from: Route.fullPath });
  const hasParsingError = !!parsingError;
  const isUnstructured =
    uploadGroup === "other" && uploadType === "unstructured";
  const isStructured = uploadGroup === "other" && uploadType === "structured";
  const isHealth = uploadGroup === "other" && uploadType === "health";
  const shouldSelectCountry = !isUnstructured && !isStructured && !isHealth;

  const validTypes = useMemo(
    () =>
      isUnstructured
        ? validUnstructuredTypes
        : isStructured
        ? validCustomStructuredTypes
        : validStructuredTypes,
    [isStructured, isUnstructured],
  );
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
      setMode,
      setTimeStamp,
    },
  } = useStore();

  const { country: storeCountry, file, source: storeSource } = uploadSlice;
  const hasUploadedFile = file != null;
  const { countryDatasets, isPrivileged } = useRoles();

  const uploadStructuredFile = useMutation({
    mutationFn: api.uploads.upload_structured,
  });

  const { data: healthGroupsQuery, isLoading: isHealthGroupsLoading } =
    useQuery({
      queryKey: ["groups"],
      queryFn: api.groups.list,
      enabled: isHealth,
    });

  const healthCountryPool = useMemo(() => {
    const geo = countryDatasets["School Geolocation"] ?? [];
    const cov = countryDatasets["School Coverage"] ?? [];
    return [...new Set([...geo, ...cov])];
  }, [countryDatasets]);

  const allCountryNamesForHealth = useMemo(() => {
    const allGroups = healthGroupsQuery?.data ?? [];
    const allGroupNames = allGroups.map(group => group.name);
    return [
      ...new Set(
        allGroupNames
          .map(name => name.split("-School"))
          .filter(split => split.length > 1)
          .map(split => split[0]),
      ),
    ];
  }, [healthGroupsQuery?.data]);

  const healthMetadataCountryOptions = useMemo(() => {
    if (!isHealth) return [];
    const base = isPrivileged ? allCountryNamesForHealth : healthCountryPool;
    return ["N/A", ...base];
  }, [isHealth, isPrivileged, allCountryNamesForHealth, healthCountryPool]);

  const [isHealthUploading, setIsHealthUploading] = useState(false);
  const [isHealthUploadError, setIsHealthUploadError] = useState(false);
  const [isHealthNullFile, setIsHealthNullFile] = useState(false);

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
    enabled:
      !isHealth &&
      (isCoverage
        ? !!source
        : isGeolocation
        ? true
        : !isUnstructured && !isStructured),
  });

  const schemaData = schemaQuery?.data;
  const schema = useMemo(() => schemaData ?? [], [schemaData]);

  useEffect(() => {
    if (!isHealth) return;
    setStepIndex(healthStep);
  }, [healthStep, isHealth, setStepIndex]);

  useEffect(() => {
    if (schema.length && file) {
      const validationError = getFileValidationError(file, validTypes);
      if (validationError) {
        setFile(null);
        setTimeStamp(null);
        setDetectedColumns([]);
        setColumnMapping({});
        setParsingError(validationError);
        setIsParsing(false);
        return;
      }

      const acceptedFileType = getAcceptedFileType(file, validTypes);
      const detector = new HeaderDetector({
        file,
        schema,
        setIsParsing: setIsParsing,
        setError: setParsingError,
        setColumnMapping,
        setDetectedColumns,
        type: acceptedFileType as AcceptedFileTypes,
      });
      if (!detector.validateFileSize()) return;
      detector.detect();
    }
  }, [
    file,
    schema,
    setColumnMapping,
    setDetectedColumns,
    setFile,
    setTimeStamp,
    validTypes,
  ]);

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
    setMode(null);
    setParsingError("");
    setIsParsing(false);
  }

  function handleOnAddFiles(addedFiles: File[]) {
    const file = addedFiles.at(0) ?? null;
    if (!file) return;

    setParsingError("");
    setIsParsing(true);

    const validationError = getFileValidationError(file, validTypes);
    if (validationError) {
      setFile(null);
      setTimeStamp(null);
      setDetectedColumns([]);
      setColumnMapping({});
      setParsingError(validationError);
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

    if (isStructured || isUnstructured) {
      setIsParsing(false);
    }
    // For school/coverage/geolocation: useEffect detects when schema is ready
  }

  function handleHealthAddFiles(addedFiles: File[]) {
    const nextFile = addedFiles.at(0) ?? null;
    if (!nextFile) return;

    setHealthFileError("");
    const looksCsv =
      nextFile.type in validHealthCsvTypes ||
      nextFile.name.toLowerCase().endsWith(".csv");

    if (!looksCsv) {
      setHealthFileError("Only CSV files are accepted.");
      return;
    }

    if (nextFile.size > MAX_UPLOAD_FILE_SIZE_MB * 1024 * 1024) {
      setHealthFileError(
        `File size exceeds ${MAX_UPLOAD_FILE_SIZE_MB} MB limit`,
      );
      return;
    }

    setUploadSliceState({
      uploadSlice: {
        ...uploadSlice,
        fuzzyCorrections: [],
        fuzzyValidationRequestKey: null,
        fuzzyValidationResult: null,
        file: nextFile,
        timeStamp: new Date(),
      },
    });
  }

  function resetHealthFlow() {
    resetUploadSliceState();
    setHealthStep(0);
    setHealthFileError("");
    setIsHealthUploadError(false);
    setIsHealthNullFile(false);
  }

  const onHealthMetadataSubmit: SubmitHandler<MetadataForm> = async data => {
    if (uploadSlice.file === null) {
      setIsHealthNullFile(true);
      return;
    }

    setIsHealthUploading(true);
    setIsHealthUploadError(false);
    setIsHealthNullFile(false);

    const metadata = { ...data };
    const country = metadata.country;
    delete metadata.country;

    Object.keys(metadata).forEach(key => {
      const k = key as keyof typeof metadata;
      if (metadata[k] === "") {
        (metadata as Record<string, unknown>)[key] = null;
      }
    });

    try {
      await uploadStructuredFile.mutateAsync({
        country,
        file: uploadSlice.file,
        source: storeSource,
        metadata: JSON.stringify({ ...metadata, mode: uploadSlice.mode }),
        portal_dataset: "health",
      });
      setUploadDate(uploadSlice.timeStamp);
      setStepIndex(2);
      void navigate({ to: "./success" });
    } catch (err) {
      console.error("Health upload failed:", err);
      setIsHealthUploadError(true);
    } finally {
      setIsHealthUploading(false);
    }
  };

  if (isHealth) {
    const csvFormats = [
      ...new Set(Object.values(validHealthCsvTypes).flat()),
    ].join(", ");

    return (
      <Stack gap={10}>
        {healthStep === 0 && (
          <>
            <div className="flex w-1/2 flex-col gap-4">
              <div className="flex w-full flex-col gap-4">
                <h2 className="font-ibmplex text-base font-semibold">
                  Upload file
                </h2>
                <p className="-mt-1 font-ibmplex text-sm font-normal text-giga-gray">
                  File formats: {csvFormats} up to {MAX_UPLOAD_FILE_SIZE_MB}MB
                </p>
                <div className="h-[78px] w-full">
                  {hasUploadedFile && file ? (
                    <FileUploaderItem
                      name={file.name}
                      status="edit"
                      onDelete={() => {
                        handleRemoveFile();
                        setHealthFileError("");
                      }}
                      iconDescription="Remove file"
                      aria-label={`Remove ${file.name}`}
                    />
                  ) : (
                    <FileUploaderDropContainer
                      accept={Object.keys(validHealthCsvTypes)}
                      name="file"
                      labelText="Click or drag a file to upload"
                      onAddFiles={(_, { addedFiles }: { addedFiles: File[] }) =>
                        handleHealthAddFiles(addedFiles)
                      }
                    />
                  )}
                </div>
                {healthFileError ? (
                  <p className="text-giga-red">{healthFileError}</p>
                ) : null}
              </div>
            </div>
            <ButtonSet className="w-full">
              <Button
                kind="secondary"
                as={Link}
                to="/upload"
                onClick={resetHealthFlow}
                className="w-full"
                renderIcon={ArrowLeft}
                isExpressive
                search={{
                  page: DEFAULT_PAGE_NUMBER,
                  page_size: DEFAULT_PAGE_SIZE,
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={!hasUploadedFile}
                className="w-full"
                renderIcon={ArrowRight}
                isExpressive
                onClick={() => setHealthStep(1)}
              >
                Proceed
              </Button>
            </ButtonSet>
          </>
        )}

        {healthStep === 1 && (
          <>
            <p className="font-ibmplex text-sm text-giga-dark-gray">
              Selected file:{" "}
              <span className="font-mono text-xs">{file?.name}</span>
            </p>
            <Health
              countryOptions={healthMetadataCountryOptions}
              isLoadingCountries={isHealthGroupsLoading}
              countryRequired={true}
              onSubmit={onHealthMetadataSubmit}
              isUploading={isHealthUploading}
              isUploadError={isHealthUploadError}
              isNullFile={isHealthNullFile}
              backButton={
                <Button
                  kind="secondary"
                  className="w-full"
                  renderIcon={ArrowLeft}
                  isExpressive
                  onClick={() => {
                    setHealthStep(0);
                    setIsHealthUploadError(false);
                    setIsHealthNullFile(false);
                  }}
                >
                  Back
                </Button>
              }
            />
          </>
        )}
      </Stack>
    );
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
                  accept={getAllowedExtensions(validTypes)}
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
