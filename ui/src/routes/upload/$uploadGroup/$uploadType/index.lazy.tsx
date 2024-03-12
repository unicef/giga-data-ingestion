import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import { Button, ButtonSet, Stack } from "@carbon/react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { parse } from "papaparse";

import UploadFile from "@/components/upload/UploadFile.tsx";
import { useStore } from "@/context/store";

export const Route = createFileRoute("/upload/$uploadGroup/$uploadType/")({
  component: Index,
});

const validTypes = {
  "text/csv": [".csv"],
};

export default function Index() {
  const {
    uploadSlice,
    uploadSliceActions: {
      incrementStepIndex,
      resetUploadSliceState,
      setUploadSliceState,
    },
  } = useStore();

  const { file } = uploadSlice;

  const hasUploadedFile = file != null;

  const handleProceedToNextStep = () => {
    if (file) {
      parse(file, {
        complete: result => {
          setUploadSliceState({
            uploadSlice: {
              ...uploadSlice,
              detectedColumns: result.data[0] as string[],
            },
          });
        },
        preview: 1,
      });

      incrementStepIndex();
    }
  };

  return (
    <Stack gap={10}>
      <div className="w-1/4">
        <UploadFile
          acceptType={validTypes}
          description="csv only, up to 10mb"
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
        />
      </div>

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
          disabled={!hasUploadedFile}
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
