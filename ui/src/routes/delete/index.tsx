import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import { Button, ButtonSet, SelectItem, Stack } from "@carbon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { api } from "@/api";
import { FileUploaderDropContainer } from "@/components/common/CarbonOverrides";
import { ErrorComponent } from "@/components/common/ErrorComponent";
import { PendingComponent } from "@/components/common/PendingComponent";
import { Select } from "@/components/forms/Select";
import { AcceptedFileTypes } from "@/constants/upload";
import { useStore } from "@/context/store";
import { ColumnValidator } from "@/utils/upload";

export const Route = createFileRoute("/delete/")({
  component: Index,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData({
      queryKey: ["countries"],
      queryFn: api.utils.listCountries,
    }),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

const validTypes = {
  "application/json": AcceptedFileTypes.JSON,
};

type DeleteRowForm = { country: string };

function Index() {
  const {
    uploadSlice,
    uploadSliceActions: {
      // incrementStepIndex,
      resetUploadSliceState,
      setUploadSliceState,
      setDetectedColumns,
    },
  } = useStore();
  const { file } = uploadSlice;

  const navigate = useNavigate({ from: "/delete" });

  const [isParsing, setIsParsing] = useState(false);
  const [parsingError, setParsingError] = useState("");
  const hasParsingError = !!parsingError;
  const hasUploadedFile = file != null;

  const { handleSubmit, register, watch } = useForm<DeleteRowForm>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      country: "",
    },
  });

  const country = watch("country");

  const {
    data: { data: allCountryNames },
  } = useSuspenseQuery({
    queryKey: ["countries"],
    queryFn: api.utils.listCountries,
  });

  function handleOnAddFiles(addedFiles: File[]) {
    const file = addedFiles.at(0) ?? null;
    if (!file) return;

    setParsingError("");
    setIsParsing(true);

    const detector = new ColumnValidator({
      file,
      setIsParsing: setIsParsing,
      setError: setParsingError,
      setValues: setDetectedColumns,
      type: validTypes[file.type as keyof typeof validTypes],
    });
    detector.validate();

    setUploadSliceState({
      uploadSlice: {
        ...uploadSlice,
        file: file,
        timeStamp: new Date(),
      },
    });
  }

  const onSubmit: SubmitHandler<DeleteRowForm> = async data => {
    void navigate({
      to: "/delete/$country",
      params: { country: data.country },
    });
  };

  const isProceedDisabled =
    !hasUploadedFile || isParsing || hasParsingError || !country;

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
          {allCountryNames.map(country => {
            return (
              <SelectItem
                value={country.name_short}
                text={country.name_short}
              />
            );
          })}
        </Select>

        <div className="w-1/4">
          <p className="cds--file--label">Upload files</p>

          <FileUploaderDropContainer
            accept={Object.keys(validTypes)}
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
            File formats: {Object.values(validTypes).join(", ")} up to 10MB
          </p>
          {hasParsingError && <p className="text-giga-red">{parsingError}</p>}
        </div>
        <ButtonSet className="w-full">
          <Button
            as={Link}
            className="w-full"
            isExpressive
            kind="secondary"
            renderIcon={ArrowLeft}
            to="/upload"
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
