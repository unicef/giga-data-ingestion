import { useState } from "react";
import { useForm } from "react-hook-form";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import { Button, ButtonSet, Loading, SelectItem, Stack } from "@carbon/react";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { api } from "@/api";
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

  const [isParsing, setIsParsing] = useState(false);

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

  const metaschemaName =
    uploadType === "coverage" ? `coverage_${source}` : `school_${uploadType}`;

  const { data: schemaQuery, isFetching: isSchemaFetching } = useQuery({
    queryFn: () => api.schema.get(metaschemaName),
    queryKey: ["schema", metaschemaName],
    enabled: isCoverage ? !!source : true,
  });
  const schema = schemaQuery?.data ?? [];

  const handleProceedToNextStep = () => {
    if (file) {
      setSource(source ?? null);
      incrementStepIndex();
    }
  };

  const isProceedDisabled =
    !hasUploadedFile ||
    (isCoverage && !source) ||
    isSchemaFetching ||
    isParsing;
  const isProceedLoading = isSchemaFetching || isParsing;
  const uploadConditionalRender =
    (!isCoverage && !isSchemaFetching) ||
    (isCoverage && !!source && !isSchemaFetching);

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

      {uploadConditionalRender && (
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
            schema={schema}
            setIsLoading={setIsParsing}
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
          disabled={isProceedDisabled}
          as={Link}
          to="./column-mapping"
          onClick={handleProceedToNextStep}
          className="w-full"
          renderIcon={
            isProceedLoading
              ? props => <Loading small={true} withOverlay={false} {...props} />
              : ArrowRight
          }
          isExpressive
        >
          Proceed
        </Button>
      </ButtonSet>
    </Stack>
  );
}
