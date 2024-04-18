import { Suspense, useMemo, useState } from "react";
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
} from "@carbon/react";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { ReactHookFormDevTools } from "@/components/utils/DevTools.tsx";
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
    context: { queryClient },
    params: { uploadGroup, uploadType },
  }) => {
    const {
      uploadSlice: { file, columnMapping },
      uploadSliceActions: { setStepIndex },
    } = useStore.getState();

    if (uploadGroup === "other" && uploadType === "unstructured") {
      setStepIndex(1);
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
    uploadSliceActions: {
      decrementStepIndex,
      incrementStepIndex,
      setUploadDate,
      setUploadId,
    },
  } = useStore();
  const navigate = useNavigate({ from: Route.fullPath });
  const { uploadType, uploadGroup } = Route.useParams();

  const isUnstructured =
    uploadGroup === "other" && uploadType === "unstructured";

  const { countryDatasets, isPrivileged } = useRoles();

  const userCountryNames = useMemo(
    () => countryDatasets[`School ${capitalizeFirstLetter(uploadType)}`] ?? [],
    [countryDatasets, uploadType],
  );

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isUploadError, setIsUploadError] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    control,
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

  const { data: allGroupsQuery, isLoading } = useSuspenseQuery({
    queryKey: ["groups"],
    queryFn: api.groups.list,
  });
  const allCountryNames = useMemo(() => {
    const allGroups = allGroupsQuery?.data ?? [];
    const allGroupNames = allGroups.map(group => group.display_name);
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

  const onSubmit: SubmitHandler<MetadataForm> = async data => {
    if (Object.keys(errors).length > 0) {
      // form has errors, don't submit
      return;
    }

    setIsUploading(true);
    setIsUploadError(false);

    const metadata = { ...data };
    const country = metadata.country;
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
      metadata: JSON.stringify(metadata),
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
        setIsUploading(false);
        setUploadDate(uploadSlice.timeStamp);
        incrementStepIndex();
      } else {
        const {
          data: { id: uploadId },
        } = await uploadFile.mutateAsync(body);
        setIsUploading(false);
        setUploadId(uploadId);
        setUploadDate(uploadSlice.timeStamp);
        incrementStepIndex();
      }

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
        <p>
          Please check if any information about the dataset is meant to be
          updated.
        </p>
        <Form className="" onSubmit={handleSubmit(onSubmit)}>
          <Stack gap={8}>
            {Object.entries(metadataMapping).map(([group, formItems]) => (
              <Stack gap={5} key={group}>
                <Section>
                  <Heading>{group}</Heading>
                  <FormGroup legendText="">
                    <Stack gap={6}>
                      {formItems.map(formItem =>
                        formItem.name === "country" ? (
                          <CountrySelect
                            countryOptions={countryOptions}
                            isLoading={isLoading}
                            errors={errors}
                            register={register("country", { required: true })}
                          />
                        ) : (
                          <RenderFormItem
                            formItem={formItem}
                            errors={errors}
                            register={register}
                          />
                        ),
                      )}
                    </Stack>
                  </FormGroup>
                </Section>
              </Stack>
            ))}

            <ButtonSet>
              <Button
                kind="secondary"
                as={Link}
                to={isUnstructured ? ".." : "../column-mapping"}
                onClick={decrementStepIndex}
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
          </Stack>
        </Form>

        <Suspense>
          <ReactHookFormDevTools control={control} />
        </Suspense>
      </Section>
    </Section>
  );
}
