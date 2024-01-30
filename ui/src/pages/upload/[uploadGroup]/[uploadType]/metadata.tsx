import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Button,
  Loading,
  RadioButton,
  Select,
  SelectItem,
  Stack,
  TextArea,
} from "@carbon/react";
import { useMutation } from "@tanstack/react-query";

import { useApi } from "@/api";
import ControlledDatepicker from "@/components/upload/ControlledDatepicker";
import ControlledRadioGroup from "@/components/upload/ControlledRadioGroup";
import countries from "@/constants/countries";
import {
  dataCollectionModalityOptions,
  dataOwnerOptions,
  domainOptions,
  geolocationDataSourceOptions,
  piiOptions,
  schoolIdTypeOptions,
  sensitivityOptions,
  sourceOptions,
} from "@/mocks/metadataFormValues";

export type MetadataFormValues = {
  dataCollectionDate: Date;
  country: string;
  dataCollectionModality: string;
  dataOwner: string;
  dateModified: Date;
  description: string;
  domain: string;
  geolocationDataSource: string;
  piiClassification: string;
  schoolIdType: string;
  sensitivityLevel: string;
  source: string;
};

export default function UploadMetadata() {
  const api = useApi();
  const location = useLocation();
  const navigate = useNavigate();

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

  const onSubmit: SubmitHandler<MetadataFormValues> = async data => {
    if (Object.keys(errors).length > 0) {
      console.log("Form has errors, not submitting");
      return;
    }

    setIsUploading(true);
    setIsUploadError(false);

    const dataset = location.pathname.split("/")[3];

    try {
      const uploadId = await uploadFile.mutateAsync({
        dataset: dataset,
        file: location.state.file,
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
      });

      setIsUploading(false);

      navigate("../success", {
        state: {
          uploadDate: location.state.timestamp,
          uploadId: uploadId.data,
        },
      });
    } catch {
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
      labelText="Geolocation Data Source"
      {...register("geolocationDataSource")}
    >
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
      labelText="Data Collection Modality"
      {...register("dataCollectionModality")}
    >
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
    <Select id="domain" labelText="Domain" {...register("domain")}>
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
    <Select id="source" labelText="Source" {...register("source")}>
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
    <Select id="dataowner" labelText="Data Owner" {...register("dataOwner")}>
      {dataOwnerOptions.map(option => (
        <SelectItem
          key={option.value}
          text={option.label}
          value={option.value}
        />
      ))}
    </Select>
  );

  const CountrySelect = () => (
    <Select id="country" labelText="Country" {...register("country")}>
      {countries.map(country => (
        <SelectItem
          key={country.name}
          text={country.name}
          value={country.name}
        />
      ))}
    </Select>
  );

  const SchoolIdTypeSelect = () => (
    <Select
      id="schoolIdType"
      labelText="School ID type"
      {...register("schoolIdType")}
    >
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
          <SourceSelect />
          <DataOwnerSelect />
          <CountrySelect />
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
            <Button kind="tertiary">Cancel</Button>
          </div>
          {isUploadError && (
            <div className="text-giga-dark-red">
              Error occured during file upload. Please try again
            </div>
          )}
        </Stack>
      </form>
    </>
  );
}
