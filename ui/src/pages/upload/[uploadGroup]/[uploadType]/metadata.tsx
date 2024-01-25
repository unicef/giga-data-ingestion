import { SubmitHandler, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import {
  Button,
  RadioButton,
  Select,
  SelectItem,
  Stack,
  TextArea,
} from "@carbon/react";

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
  collectionDate: Date;
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

// TODO wwhy does the radio button disappear??????

export default function UploadMetadata() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MetadataFormValues>();

  const onSubmit: SubmitHandler<MetadataFormValues> = data => {
    if (Object.keys(errors).length > 0) {
      console.log("Form has errors, not submitting");
      return;
    }

    console.log(data);
    // navigate("../success");
    // mutation to actually upload file
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
            name="collectionDate"
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
            <Button type="submit">Submit</Button>
            <Button kind="tertiary">Cancel</Button>
          </div>
        </Stack>
      </form>
    </>
  );
}
