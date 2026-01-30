import { useMemo, useState } from "react";
import {
  FieldErrors,
  SubmitHandler,
  UseFormRegister,
  useForm,
} from "react-hook-form";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import {
  Button,
  ButtonSet,
  Form,
  FormGroup,
  Heading,
  Loading,
  Section,
  Stack,
  Tag,
} from "@carbon/react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Sentry from "@sentry/react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router";

import { api } from "@/api";
import {
  CountrySelect,
  FreeTextInput,
  MetadataForm,
  MonthYearSelect,
  SelectFromArray,
  SelectFromEnum,
} from "@/components/upload/MetadataInputs.tsx";
import { metadataMapping, yearList } from "@/constants/metadata";
import { useStore } from "@/context/store";
import useRoles from "@/hooks/useRoles.ts";
import { MetadataFormMapping } from "@/types/metadata.ts";
import { UploadParams } from "@/types/upload.ts";
import { capitalizeFirstLetter } from "@/utils/string.ts";

export const Route = createFileRoute(
  "/upload/$uploadGroup/$uploadType/metadata",
)({
  component: Metadata,
  loader: ({
    context: { queryClient, getState },
    params: { uploadGroup, uploadType },
  }) => {
    const {
      uploadSlice: { file, columnMapping },
      uploadSliceActions: { setStepIndex },
    } = getState();

    const isUnstructured =
      uploadGroup === "other" && uploadType === "unstructured";
    const isStructured = uploadGroup === "other" && uploadType === "structured";

    if (isUnstructured) {
      setStepIndex(1);
    } else if (isStructured) {
      // Structured datasets should not go through metadata step
      setStepIndex(0);
      throw redirect({ from: Route.fullPath, to: ".." });
    } else if (
      !file ||
      Object.values(columnMapping).filter(Boolean).length === 0
    ) {
      setStepIndex(1);
      throw redirect({ from: Route.fullPath, to: "../column-mapping" });
    }

    return queryClient.ensureQueryData({
      queryKey: ["groups"],
      queryFn: api.groups.list,
    });
  },
});

function getFormRows(
  groupKey: string,
  formItems: MetadataFormMapping[],
): MetadataFormMapping[][] {
  if (groupKey === "") {
    return formItems.map(item => [item]);
  }
  if (groupKey === "Information about the school dataset") {
    const pairs: MetadataFormMapping[][] = [];
    for (let i = 0; i < 6 && i < formItems.length; i += 2) {
      pairs.push(formItems.slice(i, i + 2));
    }
    if (formItems.length > 6) {
      pairs.push(...formItems.slice(6).map(item => [item]));
    }
    return pairs;
  }
  if (
    groupKey === "Information about national school data collection practices"
  ) {
    const pairs: MetadataFormMapping[][] = [];
    for (let i = 0; i < formItems.length; i += 2) {
      pairs.push(formItems.slice(i, i + 2));
    }
    return pairs;
  }
  return formItems.map(item => [item]);
}

const RenderFormItem = ({
  formItem,
  errors,
  register,
}: {
  formItem: MetadataFormMapping;
  errors: FieldErrors;
  register: UseFormRegister<MetadataForm>;
}) => {
  switch (formItem.type) {
    case "text": {
      return (
        <FreeTextInput
          formItem={formItem}
          errors={errors}
          register={register(formItem.name, {
            required: formItem.required,
          })}
        />
      );
    }
    case "enum": {
      return (
        <SelectFromEnum
          formItem={formItem}
          errors={errors}
          register={register(formItem.name, {
            required: formItem.required,
          })}
        />
      );
    }
    case "year": {
      return (
        <SelectFromArray
          options={yearList}
          formItem={formItem}
          errors={errors}
          register={register(formItem.name, {
            required: formItem.required,
          })}
        />
      );
    }
    case "month-year": {
      return (
        <MonthYearSelect
          formItem={formItem}
          errors={errors}
          register={register}
        />
      );
    }
    default: {
      return null;
    }
  }
};

function Metadata() {
  const {
    uploadSlice,
    uploadSliceActions: { setStepIndex, setUploadDate, setUploadId },
  } = useStore();
  const navigate = useNavigate({ from: Route.fullPath });
  const { uploadType, uploadGroup } = Route.useParams();

  const isUnstructured =
    uploadGroup === "other" && uploadType === "unstructured";
  const isStructured = uploadGroup === "other" && uploadType === "structured";

  const { countryDatasets, isPrivileged } = useRoles();

  const userCountryNames = useMemo(
    () => countryDatasets[`School ${capitalizeFirstLetter(uploadType)}`] ?? [],
    [countryDatasets, uploadType],
  );

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isUploadError, setIsUploadError] = useState<boolean>(false);
  const [isNullFile, setIsNullFile] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MetadataForm>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: zodResolver(MetadataForm),
  });

  const uploadFile = useMutation({
    mutationFn: api.uploads.upload,
  });

  const uploadUnstructuredFile = useMutation({
    mutationFn: api.uploads.upload_unstructured,
  });

  const uploadStructuredFile = useMutation({
    mutationFn: api.uploads.upload_structured,
  });

  const { data: allGroupsQuery, isLoading } = useSuspenseQuery({
    queryKey: ["groups"],
    queryFn: api.groups.list,
  });
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
  let countryOptions = isPrivileged ? allCountryNames : userCountryNames;
  if (isUnstructured || isStructured) {
    countryOptions = ["N/A", ...countryOptions];
  }

  const onSubmit: SubmitHandler<MetadataForm> = async data => {
    if (uploadSlice.file === null) {
      // Log to Sentry with context
      Sentry.captureException(
        new Error("File upload attempted with missing file"),
        {
          tags: {
            component: "Metadata",
            route: "upload-metadata",
            uploadType,
            uploadGroup,
          },
          extra: {
            uploadSlice: {
              hasFile: !!uploadSlice.file,
              hasColumnMapping: !!uploadSlice.columnMapping,
              stepIndex: uploadSlice.stepIndex,
              mode: uploadSlice.mode,
              source: uploadSlice.source,
            },
            formData: data,
            timestamp: new Date().toISOString(),
          },
        },
      );

      setIsNullFile(true);
      return;
    }

    if (Object.keys(errors).length > 0) {
      // form has errors, don't submit
      return;
    }

    setIsUploading(true);
    setIsUploadError(false);

    const metadata = { ...data };
    // For structured datasets, use "N/A" as default country since they're global
    const country = isStructured ? "N/A" : metadata.country;
    delete metadata.country;

    const columnMapping = uploadSlice.columnMapping;
    const correctedColumnMapping = Object.fromEntries(
      Object.entries(columnMapping).map(([key, value]) => [value, key]),
    );

    Object.keys(metadata).forEach(key => {
      if (key === "next_school_data_collection") {
        metadata[key] = `${metadata[key].month ?? ""} ${
          metadata[key].year ?? ""
        }`.trim();
      }

      if (metadata[key] === "") metadata[key] = null;
    });

    const body: UploadParams = {
      metadata: JSON.stringify({ ...metadata, mode: uploadSlice.mode }),
      country,
      column_to_schema_mapping: JSON.stringify(correctedColumnMapping),
      column_license: JSON.stringify(uploadSlice.columnLicense),
      dataset: uploadType,
      file: uploadSlice.file!,
      source: uploadSlice.source,
    };

    try {
      if (isUnstructured) {
        await uploadUnstructuredFile.mutateAsync(body);
        setUploadDate(uploadSlice.timeStamp);
      } else if (isStructured) {
        await uploadStructuredFile.mutateAsync(body);
        setUploadDate(uploadSlice.timeStamp);
      } else {
        const {
          data: { id: uploadId, created: created },
        } = await uploadFile.mutateAsync(body);
        setUploadId(uploadId);
        setUploadDate(new Date(created));
      }

      setIsUploading(false);
      setStepIndex(3);
      void navigate({ to: "../success" });
    } catch {
      console.error(
        "uploadFile.error.message",
        uploadFile.error?.message ?? "",
      );
      setIsUploadError(true);
      setIsUploading(false);
    }
  };

  return (
    <Section>
      <Section>
        <Heading>Add Metadata</Heading>
        <div>
          <p>
            Please provide any additional context on your data by filling in the
            metadata sheet below.
          </p>
          <p>
            Not all metadata information is made visible on Project Connect but
            does allow the Giga team to understand where the data has come from,
            and how it can be best integrated into our dataset.
          </p>
          <Tag type="red">*Required</Tag>
        </div>
        <Form className="" onSubmit={handleSubmit(onSubmit)}>
          <Stack gap={8}>
            {Object.entries(metadataMapping).map(([group, formItems]) => {
              const rows = getFormRows(group, formItems);
              return (
                <Stack gap={5} key={group || "general"}>
                  <Section>
                    {group && <Heading>{group}</Heading>}
                    <FormGroup legendText="">
                      <Stack gap={6}>
                        {rows.map((row, rowIndex) => (
                          <div
                            key={rowIndex}
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                row.length === 2 ? "1fr 1fr" : "1fr",
                              gap: "1rem",
                            }}
                          >
                            {row.map(formItem =>
                              formItem.name === "country" ? (
                                <div key={formItem.name}>
                                  <CountrySelect
                                    countryOptions={countryOptions}
                                    isLoading={isLoading}
                                    errors={errors}
                                    register={register("country", {
                                      required: !isStructured,
                                    })}
                                  />
                                </div>
                              ) : (
                                <div key={formItem.name}>
                                  <RenderFormItem
                                    formItem={formItem}
                                    errors={errors}
                                    register={register}
                                  />
                                </div>
                              ),
                            )}
                          </div>
                        ))}
                      </Stack>
                    </FormGroup>
                  </Section>
                </Stack>
              );
            })}

            <ButtonSet>
              <Button
                kind="secondary"
                as={Link}
                to={isUnstructured || isStructured ? ".." : "../column-mapping"}
                onClick={() => setStepIndex(1)}
                className="w-full"
                renderIcon={ArrowLeft}
                isExpressive
              >
                Back
              </Button>
              <Button
                disabled={isUploading}
                renderIcon={
                  isUploading
                    ? props => (
                        <Loading small={true} withOverlay={false} {...props} />
                      )
                    : ArrowRight
                }
                type="submit"
                className="w-full"
                isExpressive
              >
                Continue
              </Button>
            </ButtonSet>

            {isUploadError && (
              <div className="text-giga-dark-red">
                Error occurred during file upload. Please try again
              </div>
            )}
            {isNullFile && (
              <div className="text-giga-red">
                File is missing at this step, please upload the file again
              </div>
            )}
          </Stack>
        </Form>

        {/* <Suspense>
          <ReactHookFormDevTools control={control} />
        </Suspense> */}
      </Section>
    </Section>
  );
}
