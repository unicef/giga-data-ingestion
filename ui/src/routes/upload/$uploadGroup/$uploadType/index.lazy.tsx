import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import { Button, ButtonSet, Stack } from "@carbon/react";
import { Link, createFileRoute } from "@tanstack/react-router";

import UploadFile from "@/components/upload/UploadFile.tsx";
import { useStore } from "@/store.ts";

export const Route = createFileRoute("/upload/$uploadGroup/$uploadType/")({
  component: Index,
});

export default function Index() {
  const { upload, setUpload, resetUploadState, incrementStepIndex } =
    useStore();

  const hasUploadedFile = upload.file != null;

  return (
    <Stack gap={10}>
      <div className="w-1/4">
        <UploadFile
          file={upload.file}
          setFile={file => setUpload({ ...upload, file })}
          setTimestamp={timestamp => setUpload({ ...upload, timestamp })}
        />
      </div>

      <ButtonSet className="w-full">
        <Button
          kind="secondary"
          as={Link}
          to="/upload"
          onClick={resetUploadState}
          className="w-full"
          renderIcon={ArrowLeft}
          isExpressive
        >
          Cancel
        </Button>
        <Button
          disabled={!hasUploadedFile}
          as={Link}
          to="./metadata"
          onClick={incrementStepIndex}
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
