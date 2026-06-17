import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import {
  Button,
  ButtonSet,
  Checkbox,
  InlineNotification,
  RadioButton,
  RadioButtonGroup,
  SelectItem,
  Stack,
} from "@carbon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { api } from "@/api";
import { FileUploaderDropContainer } from "@/components/common/CarbonOverrides";
import { ErrorComponent } from "@/components/common/ErrorComponent";
import { PendingComponent } from "@/components/common/PendingComponent";
import { Select } from "@/components/forms/Select";
import { DELETE_PREVIEW_ID_CAP } from "@/constants/upload";
import { useStore } from "@/context/store";
import { DeleteIdType, DeleteType } from "@/types/delete";
import { DeleteFileParser } from "@/utils/upload";

export const Route = createFileRoute("/delete/new")({
  component: NewDeletionRequest,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData({
      queryKey: ["countries"],
      queryFn: api.utils.listCountries,
    }),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

const ACCEPT_MIME_TYPES = [
  "text/csv",
  "application/csv",
  "application/json",
  "application/vnd.ms-excel",
  "application/x-ole-storage",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

type DeleteRowForm = {
  country: string;
  deleteType: DeleteType;
  idType: DeleteIdType;
  verifyCount: boolean;
};

function NewDeletionRequest() {
  const {
    uploadSlice,
    uploadSliceActions: {
      resetUploadSliceState,
      setUploadSliceState,
      setDetectedColumns,
    },
  } = useStore();
  const { file, detectedColumns } = uploadSlice;

  const navigate = useNavigate({ from: "/delete/new" });

  const [isParsing, setIsParsing] = useState(false);
  const [parsingError, setParsingError] = useState("");
  const hasParsingError = !!parsingError;
  const hasUploadedFile = file != null;

  const { handleSubmit, register, watch, setValue } = useForm<DeleteRowForm>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      country: "",
      deleteType: "specific",
      idType: "school_id_giga",
      verifyCount: true,
    },
  });

  const country = watch("country");
  const deleteType = watch("deleteType");
  const idType = watch("idType");
  const verifyCount = watch("verifyCount");

  const {
    data: { data: allCountryNames },
  } = useSuspenseQuery({
    queryKey: ["countries"],
    queryFn: api.utils.listCountries,
  });

  function handleDeleteTypeChange(value: unknown) {
    const newType = value as DeleteType;
    setValue("deleteType", newType);
    if (newType === "all") {
      resetUploadSliceState();
      setParsingError("");
    }
  }

  function handleOnAddFiles(addedFiles: File[]) {
    const newFile = addedFiles.at(0) ?? null;
    if (!newFile) return;

    setParsingError("");
    setIsParsing(true);

    const parser = new DeleteFileParser({
      file: newFile,
      setValues: (ids: string[]) => {
        if (ids.length > DELETE_PREVIEW_ID_CAP) {
          setValue("verifyCount", false);
        }
        setDetectedColumns(ids);
      },
      setIsParsing,
      setError: setParsingError,
    });
    parser.parse();

    setUploadSliceState({
      uploadSlice: {
        ...uploadSlice,
        file: newFile,
        timeStamp: new Date(),
      },
    });
  }

  const onSubmit: SubmitHandler<DeleteRowForm> = async data => {
    void navigate({
      to: "/delete/$country",
      params: { country: data.country },
      search: {
        deleteType: data.deleteType,
        idType: data.idType,
        verifyCount: data.verifyCount,
      },
    });
  };

  const isSpecific = deleteType === "specific";
  const isProceedDisabled = isSpecific
    ? !hasUploadedFile || isParsing || hasParsingError || !country
    : !country;
  const isOverPreviewCap = detectedColumns.length > DELETE_PREVIEW_ID_CAP;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap={10}>
        <Stack gap={1}>
          <h2 className="text-[23px] capitalize">
            What will you be deleting today?
          </h2>
          <p>
            School data is the dataset of schools location & their attributes
            like name, education level, internet connection, computer count etc.
          </p>
        </Stack>

        <Select
          id="country"
          labelText="Country"
          helperText="What country are you deleting from?"
          placeholder="Country"
          className="w-1/4"
          {...register("country", { required: true })}
        >
          <SelectItem value="" text="" />
          {allCountryNames.map(country => (
            <SelectItem
              key={country.name_short}
              value={country.name_short}
              text={country.name_short}
            />
          ))}
        </Select>

        <RadioButtonGroup
          legendText="What would you like to delete?"
          name="deleteType"
          valueSelected={deleteType}
          onChange={handleDeleteTypeChange}
        >
          <RadioButton
            labelText="Delete specific schools (upload a file of IDs)"
            value="specific"
            id="deleteType-specific"
          />
          <RadioButton
            labelText="Delete all schools in the selected country"
            value="all"
            id="deleteType-all"
          />
        </RadioButtonGroup>

        {deleteType === "all" && (
          <InlineNotification
            kind="warning"
            title="This will delete every school in the selected country."
            subtitle="You will be asked to confirm after the number of affected schools is retrieved."
            hideCloseButton
          />
        )}

        {isSpecific && (
          <>
            <RadioButtonGroup
              legendText="ID column type in your file"
              name="idType"
              valueSelected={idType}
              onChange={(value: unknown) =>
                setValue("idType", value as DeleteIdType)
              }
            >
              <RadioButton
                labelText="Giga ID (school_id_giga)"
                value="school_id_giga"
                id="idType-giga"
              />
              <RadioButton
                labelText="Government ID (school_id_govt)"
                value="school_id_govt"
                id="idType-govt"
              />
            </RadioButtonGroup>

            <div className="w-1/4">
              <p className="cds--file--label">Upload file</p>
              <FileUploaderDropContainer
                accept={ACCEPT_MIME_TYPES}
                name="file"
                labelText={
                  hasUploadedFile
                    ? file.name
                    : "Click or drag a file here to upload"
                }
                onAddFiles={(_, { addedFiles }: { addedFiles: File[] }) =>
                  handleOnAddFiles(addedFiles)
                }
              />
              <p className="cds--label-description">
                File formats: CSV, Excel (.xlsx, .xls), JSON — single column
                with header, up to 100MB
              </p>
              {hasParsingError && (
                <p className="text-giga-red">{parsingError}</p>
              )}
            </div>

            <Checkbox
              id="verifyCount"
              labelText="Verify affected school count before deleting"
              checked={verifyCount}
              disabled={isOverPreviewCap}
              onChange={(_, { checked }) => setValue("verifyCount", checked)}
              helperText={
                isOverPreviewCap
                  ? `Not available above ${DELETE_PREVIEW_ID_CAP.toLocaleString()} IDs. The count check will be skipped, but all ${detectedColumns.length.toLocaleString()} IDs will still be submitted.`
                  : undefined
              }
            />
          </>
        )}

        <ButtonSet className="w-full">
          <Button
            as={Link}
            className="w-full"
            isExpressive
            kind="secondary"
            renderIcon={ArrowLeft}
            to="/delete"
            onClick={resetUploadSliceState}
          >
            Cancel
          </Button>
          <Button
            className="w-full"
            disabled={isProceedDisabled}
            isExpressive
            renderIcon={ArrowRight}
            type="submit"
          >
            Proceed
          </Button>
        </ButtonSet>
      </Stack>
    </form>
  );
}
