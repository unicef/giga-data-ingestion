import { useForm } from "react-hook-form";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import { Button, ButtonSet, SelectItem, Stack } from "@carbon/react";
import { Link, createFileRoute } from "@tanstack/react-router";

import { Select } from "@/components/forms/Select.tsx";
import UploadFile from "@/components/upload/UploadFile.tsx";
import { useStore } from "@/context/store";
import { sourceOptions } from "@/mocks/metadataFormValues.tsx";

export const Route = createFileRoute("/upload/$uploadGroup/$uploadType/")({
  component: Index,
});

const validTypes = {
  "text/csv": [".csv"],
};

export default function Index() {
  const { uploadType } = Route.useParams();
  const isCoverage = uploadType === "coverage";

  const {
    uploadSlice,
    uploadSliceActions: {
      incrementStepIndex,
      resetUploadSliceState,
      setUploadSliceState,
      setSource,
    },
  } = useStore();
  const { file, source: storeSource } = uploadSlice;
  const hasUploadedFile = file != null;

  const { register, watch } = useForm<{ source: string | null }>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      source: storeSource,
    },
  });

  const source = watch("source");

  const handleProceedToNextStep = () => {
    if (file) {
      setSource(source ?? null);
      incrementStepIndex();
    }
  };

  return (
    <Stack gap={10}>
      {isCoverage && (
        <Select
          id="source"
          labelText="Source"
          placeholder="Source"
          className="w-1/4"
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

      {(!isCoverage || (isCoverage && !!source)) && (
        <div className="w-1/4">
          <UploadFile
            acceptType={validTypes}
            description="CSV only, up to 10 MB"
            file={file}
            setFile={file =>
              setUploadSliceState({
                uploadSlice: { ...uploadSlice, file: file },
              })
            }
            setTimestamp={timestamp =>
              setUploadSliceState({
                uploadSlice: { ...uploadSlice, timeStamp: timestamp },
              })
            }
            source={source}
          />
        </div>
      )}

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
          disabled={!hasUploadedFile || (isCoverage && !source)}
          as={Link}
          to="./column-mapping"
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
