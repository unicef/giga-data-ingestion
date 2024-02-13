import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import {
  Button,
  Loading,
  RadioButton,
  SelectItem,
  Stack,
  TextArea,
} from "@carbon/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { useApi } from "@/api";
import { Select } from "@/components/forms/Select.tsx";
import ControlledDatepicker from "@/components/upload/ControlledDatepicker.tsx";
import ControlledRadioGroup from "@/components/upload/ControlledRadioGroup";
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
import { useStore } from "@/store.ts";
import { MetadataFormValues } from "@/types/metadata.ts";
import { filterCountryDatasetFromGraphGroup } from "@/utils/group";
import { capitalizeFirstLetter } from "@/utils/string.ts";

export const Route = createFileRoute(
  "/upload/$uploadGroup/$uploadType/metadata",
)({
  component: Metadata,
});

function Metadata() {
  const api = useApi();
  const { upload, setUpload } = useStore();
  const navigate = useNavigate({ from: Route.fullPath });
  const { uploadType = "" } = Route.useParams();

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isUploadError, setIsUploadError] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MetadataFormValues>();

  const uploadFile = useMutation({
    mutationFn: api.uploads.upload_file,
  });

  const { data: userData, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: api.users.get_groups_from_email,
  });

  const datasetSuffix = `-School ${capitalizeFirstLetter(uploadType)}`;

  const userCountryDatasets = filterCountryDatasetFromGraphGroup(
    userData?.data.member_of ?? [],
    datasetSuffix,
  );

  const userCountries = userCountryDatasets
    .map(countryDataset => countryDataset.display_name.split("-")[0])
    .sort((a, b) => b.localeCompare(a))
    .reverse();

  const onSubmit: SubmitHandler<MetadataFormValues> = async data => {
    if (Object.keys(errors).length > 0) {
      console.log("Form has errors, not submitting");
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
      const uploadId = await uploadFile.mutateAsync(body);

      setIsUploading(false);

      setUpload({
        ...upload,
        uploadDate: upload.timestamp?.toLocaleString() ?? "",
        uploadId: uploadId.data,
      });

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
    <>
      <h4 className="text-base text-giga-gray">Step 1: Upload</h4>
      <h2 className="text-[23px]">Step 2: Metadata</h2>
      <p>
        Please check if any information about the dataset is meant to be
        updated.
      </p>

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
          <CountrySelect countryOptions={userCountries} isLoading={isLoading} />
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
          <div className="flex gap-4">
            <Button
              {...(isUploading
                ? {
                    disabled: true,
                    renderIcon: props => (
                      <Loading small={true} withOverlay={false} {...props} />
                    ),
                  }
                : {})}
              type="submit"
            >
              Submit
            </Button>
            <Button kind="tertiary" as={Link} to="..">
              Cancel
            </Button>
          </div>
          {isUploadError && (
            <div className="text-giga-dark-red">
              Error occurred during file upload. Please try again
            </div>
          )}
        </Stack>
      </form>
    </>
  );
}
