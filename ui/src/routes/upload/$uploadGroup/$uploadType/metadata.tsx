import { useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import {
  Button,
  ButtonSet,
  Heading,
  Loading,
  RadioButton,
  Section,
  SelectItem,
  Stack,
  TextArea,
} from "@carbon/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router";

import { useApi } from "@/api";
import { Select } from "@/components/forms/Select.tsx";
import ControlledDatepicker from "@/components/upload/ControlledDatepicker.tsx";
import ControlledRadioGroup from "@/components/upload/ControlledRadioGroup";
import {
  collectionDateHelperText,
  collectionModalityHelperText,
  dataOwnerHelperText,
  schoolIdTypeHelperText,
} from "@/constants/metadata";
import { useStore } from "@/context/store";
import useRoles from "@/hooks/useRoles.ts";
import {
  dataCollectionModalityOptions,
  dataOwnerOptions,
  domainOptions,
  geolocationDataSourceOptions,
  piiOptions,
  schoolIdTypeOptions,
  sensitivityOptions,
} from "@/mocks/metadataFormValues.tsx";
import { MetadataFormValues } from "@/types/metadata.ts";
import { capitalizeFirstLetter } from "@/utils/string.ts";

export const Route = createFileRoute(
  "/upload/$uploadGroup/$uploadType/metadata",
)({
  component: Metadata,
  loader: () => {
    const {
      uploadSlice: { file, columnMapping },
      uploadSliceActions: { setStepIndex },
    } = useStore.getState();
    if (!file || Object.values(columnMapping).filter(Boolean).length === 0) {
      setStepIndex(1);
      throw redirect({ from: Route.fullPath, to: "../column-mapping" });
    }
  },
});

function Metadata() {
  const api = useApi();

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
  const { uploadType } = Route.useParams();
  const isCoverage = uploadType === "coverage";

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
  } = useForm<MetadataFormValues>();

  const uploadFile = useMutation({
    mutationFn: api.uploads.upload,
  });

  const { data: allGroupsQuery, isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: api.groups.list,
  });
  const allCountryNames = useMemo(() => {
    const allGroups = allGroupsQuery?.data ?? [];
    const allGroupNames = allGroups.map(group => group.display_name);
    return [
      ...new Set(
        allGroupNames
          .map(name => name.split("-"))
          .filter(split => split.length > 1)
          .map(split => split[0]),
      ),
    ];
  }, [allGroupsQuery?.data]);

  const onSubmit: SubmitHandler<MetadataFormValues> = async data => {
    if (Object.keys(errors).length > 0) {
      // form has errors, don't submit
      return;
    }

    setIsUploading(true);
    setIsUploadError(false);

    const columnMapping = uploadSlice.columnMapping;
    const correctedColumnMapping = Object.fromEntries(
      Object.entries(columnMapping).map(([key, value]) => [value, key]),
    );

    const body = {
      column_to_schema_mapping: JSON.stringify(correctedColumnMapping),
      country: data.country,
      data_collection_date: new Date(data.dataCollectionDate).toISOString(),
      data_collection_modality: data.dataCollectionModality,
      data_owner: data.dataOwner,
      dataset: uploadType,
      date_modified: new Date(data.dateModified).toISOString(),
      description: data.description,
      domain: data.domain,
      file: uploadSlice.file!,
      geolocation_data_source: data.geolocationDataSource,
      pii_classification: data.piiClassification,
      school_id_type: data.schoolIdType,
      sensitivity_level: data.sensitivityLevel,
      source: uploadSlice.source,
    };

    try {
      const {
        data: { id: uploadId },
      } = await uploadFile.mutateAsync(body);

      setIsUploading(false);

      setUploadDate(uploadSlice.timeStamp);
      setUploadId(uploadId);
      incrementStepIndex();
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

  const SensitivityRadio = () => (
    <ControlledRadioGroup
      control={control}
      legendText="Sensitivity Level"
      name="sensitivityLevel"
    >
      {sensitivityOptions.map(option => (
        <RadioButton
          id={option}
          key={option}
          labelText={option}
          value={option}
        />
      ))}
    </ControlledRadioGroup>
  );

  const PIIRadio = () => (
    <ControlledRadioGroup
      control={control}
      legendText="PII Classification"
      name="piiClassification"
    >
      {piiOptions.map(option => (
        <RadioButton
          id={option}
          key={option}
          labelText={option}
          value={option}
        />
      ))}
    </ControlledRadioGroup>
  );

  const GeolocationDataSourceSelect = () => (
    <Select
      id="geolocationDataSource"
      invalid={!!errors.geolocationDataSource}
      labelText="Geolocation Data Source"
      placeholder="Geolocation Data Source"
      {...register("geolocationDataSource", { required: true })}
    >
      <SelectItem value="" text="" />
      {geolocationDataSourceOptions.map(option => (
        <SelectItem key={option} text={option} value={option} />
      ))}
    </Select>
  );

  const DataCollectionModalitySelect = () => (
    <Select
      id="dataCollectionModality"
      helperText={collectionModalityHelperText}
      invalid={!!errors.dataCollectionModality}
      labelText="Data Collection Modality"
      placeholder="Data Collection Modality"
      {...register("dataCollectionModality", { required: true })}
    >
      <SelectItem value="" text="" />

      {dataCollectionModalityOptions.map(option => (
        <SelectItem key={option} text={option} value={option} />
      ))}
    </Select>
  );

  const DomainSelect = () => (
    <Select
      id="domain"
      invalid={!!errors.domain}
      labelText="Domain"
      placeholder="Domain"
      {...register("domain", { required: true })}
    >
      <SelectItem value="" text="" />

      {domainOptions.map(option => (
        <SelectItem key={option} text={option} value={option} />
      ))}
    </Select>
  );

  const DataOwnerSelect = () => (
    <Select
      id="dataowner"
      helperText={dataOwnerHelperText}
      invalid={!!errors.dataOwner}
      labelText="Data Owner"
      placeholder="Data Owner"
      {...register("dataOwner", { required: true })}
    >
      <SelectItem value="" text="" />
      {dataOwnerOptions.map(option => (
        <SelectItem key={option} text={option} value={option} />
      ))}
    </Select>
  );
  const CountrySelect = ({
    countryOptions,
    isLoading,
  }: {
    countryOptions: string[];
    isLoading: boolean;
  }) => {
    if (isLoading) {
      return (
        <Select
          disabled
          id="country"
          labelText="Loading..."
          placeholder="Loading..."
        >
          <SelectItem text="Loading..." value="" />
        </Select>
      );
    }

    return (
      <Select
        id="country"
        invalid={!!errors.country}
        labelText="Country"
        placeholder="Country"
        {...register("country", { required: true })}
      >
        <SelectItem value="" text="" />
        {countryOptions.map(country => (
          <SelectItem key={country} text={country} value={country} />
        ))}
      </Select>
    );
  };

  const SchoolIdTypeSelect = () => (
    <Select
      id="schoolIdType"
      helperText={schoolIdTypeHelperText}
      invalid={!!errors.schoolIdType}
      labelText="School ID type"
      placeholder="School ID type"
      {...register("schoolIdType", { required: true })}
    >
      <SelectItem value="" text="" />
      {schoolIdTypeOptions.map(option => (
        <SelectItem key={option} text={option} value={option} />
      ))}
    </Select>
  );

  return (
    <Section>
      <Section>
        <Heading>Add Metadata</Heading>
        <p>
          Please check if any information about the dataset is meant to be
          updated.
        </p>
      </Section>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={5}>
          <SensitivityRadio />
          <PIIRadio />
          {!isCoverage && <GeolocationDataSourceSelect />}
          <DataCollectionModalitySelect />
          <ControlledDatepicker
            control={control}
            datePickerProps={{
              datePickerType: "single",
            }}
            name="dataCollectionDate"
            datePickerInputProps={{
              invalidText: "Select a date",
              id: "collectionDate",
              labelText: "Data Collection Date",
              helperText: collectionDateHelperText,
              placeholder: "yyyy-mm-dd",
            }}
          />
          <DomainSelect />
          <ControlledDatepicker
            control={control}
            datePickerProps={{
              datePickerType: "single",
            }}
            name="dateModified"
            datePickerInputProps={{
              invalidText: "Select a date",
              id: "dateModified",
              labelText: "Date Modified",
              placeholder: "yyyy-mm-dd",
            }}
          />
          <DataOwnerSelect />
          <CountrySelect
            countryOptions={isPrivileged ? allCountryNames : userCountryNames}
            isLoading={isLoading}
          />
          <SchoolIdTypeSelect />
          <TextArea
            invalid={Boolean(errors.description)}
            invalidText={String(errors.description?.message)}
            labelText="Description"
            rows={4}
            id="description"
            {...register("description", {
              required: "Please enter a description",
            })}
          />

          <ButtonSet>
            <Button
              kind="secondary"
              as={Link}
              to="../column-mapping"
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
      </form>
    </Section>
  );
}
