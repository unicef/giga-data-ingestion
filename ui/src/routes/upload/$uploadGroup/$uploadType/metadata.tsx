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
  sourceOptions,
} from "@/mocks/metadataFormValues.tsx";
import { MetadataFormValues } from "@/types/metadata.ts";
import { capitalizeFirstLetter } from "@/utils/string.ts";

export const Route = createFileRoute(
  "/upload/$uploadGroup/$uploadType/metadata",
)({
  component: Metadata,
  loader: () => {
    const {
      upload: { file },
    } = useStore.getState();
    if (!file) {
      throw redirect({ to: ".." });
    }
  },
});

function Metadata() {
  const api = useApi();
  const { upload, setUpload, incrementStepIndex, decrementStepIndex } =
    useStore();
  const navigate = useNavigate({ from: Route.fullPath });
  const { uploadType } = Route.useParams();
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

    const body = {
      dataset: uploadType,
      file: upload.file!,
      sensitivity_level: data.sensitivityLevel,
      pii_classification: data.piiClassification,
      geolocation_data_source: data.geolocationDataSource,
      data_collection_modality: data.dataCollectionModality,
      data_collection_date: new Date(data.dataCollectionDate).toISOString(),
      domain: data.domain,
      date_modified: new Date(data.dateModified).toISOString(),
      source: data.source,
      data_owner: data.dataOwner,
      country: data.country,
      school_id_type: data.schoolIdType,
      description: data.description,
    };

    try {
      const {
        data: { id: uploadId },
      } = await uploadFile.mutateAsync(body);

      setIsUploading(false);

      setUpload({
        ...upload,
        uploadDate: upload.timestamp,
        uploadId,
      });

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
          id={option.value}
          key={option.value}
          labelText={option.label}
          value={option.value}
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
          id={option.value}
          key={option.value}
          labelText={option.label}
          value={option.value}
        />
      ))}
    </ControlledRadioGroup>
  );

  const GeolocationDataSourceSelect = () => (
    <Select
      id="geolocatinDataSource"
      invalid={!!errors.geolocationDataSource}
      labelText="Geolocation Data Source"
      placeholder="Geolocation Data Source"
      {...register("geolocationDataSource", { required: true })}
    >
      <SelectItem value="" text="" />
      {geolocationDataSourceOptions.map(option => (
        <SelectItem
          key={option.value}
          text={option.label}
          value={option.value}
        />
      ))}
    </Select>
  );

  const DataCollectionModalitySelect = () => (
    <Select
      id="dataCollectionModality"
      invalid={!!errors.dataCollectionModality}
      labelText="Data Collection Modality"
      placeholder="Data Collection Modality"
      {...register("dataCollectionModality", { required: true })}
    >
      <SelectItem value="" text="" />

      {dataCollectionModalityOptions.map(option => (
        <SelectItem
          key={option.value}
          text={option.label}
          value={option.value}
        />
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
        <SelectItem
          key={option.value}
          text={option.label}
          value={option.value}
        />
      ))}
    </Select>
  );

  const SourceSelect = () => (
    <Select
      id="source"
      invalid={!!errors.source}
      labelText="Source"
      placeholder="Source"
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
  );

  const DataOwnerSelect = () => (
    <Select
      id="dataowner"
      invalid={!!errors.dataOwner}
      labelText="Data Owner"
      placeholder="Data Owner"
      {...register("dataOwner", { required: true })}
    >
      <SelectItem value="" text="" />
      {dataOwnerOptions.map(option => (
        <SelectItem
          key={option.value}
          text={option.label}
          value={option.value}
        />
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
      invalid={!!errors.schoolIdType}
      labelText="School ID type"
      placeholder="School ID type"
      {...register("schoolIdType", { required: true })}
    >
      <SelectItem value="" text="" />
      {schoolIdTypeOptions.map(option => (
        <SelectItem
          key={option.value}
          text={option.label}
          value={option.value}
        />
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
          <GeolocationDataSourceSelect />
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
              labelText: "Date Collection Date",

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
          {uploadType === "coverage" && <SourceSelect />}
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
              to=".."
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
