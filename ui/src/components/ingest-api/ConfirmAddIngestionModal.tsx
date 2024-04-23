import { Dispatch, SetStateAction, useState } from "react";

import { InlineNotification, Modal, Stack } from "@carbon/react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { api } from "@/api";
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from "@/constants/pagination.ts";
import { useStore } from "@/context/store";

interface ConfirmAddIngestionModalInputs {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const ConfirmAddIngestionModal = ({
  open,
  setOpen,
}: ConfirmAddIngestionModalInputs) => {
  const {
    apiIngestionSlice: { columnMapping, file, schoolConnectivity, schoolList },
  } = useStore();
  const navigate = useNavigate({ from: "/ingest-api/add/school-connectivity" });

  const [showErrorNotification, setShowErrorNotification] = useState(false);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: api.qos.create_api_ingestion,
    mutationKey: ["school_list"],
  });

  const onSubmit = async () => {
    setShowErrorNotification(false);

    const correctedColumnMapping = Object.fromEntries(
      Object.entries(columnMapping)
        .map(([key, value]) => [value, key])
        .filter(([key, value]) => !!key && !!value),
    );

    await mutateAsync(
      {
        school_connectivity: { ...schoolConnectivity, error_message: null },
        school_list: {
          ...schoolList,
          column_to_schema_mapping: JSON.stringify(correctedColumnMapping),
          enabled: true,
          error_message: null,
        },
        file: file,
      },
      {
        onSuccess: async () => {
          setOpen(false);
          await navigate({
            to: "/ingest-api",
            search: {
              page: DEFAULT_PAGE_NUMBER,
              page_size: DEFAULT_PAGE_SIZE,
            },
          });
        },
        onError: () => setShowErrorNotification(true),
      },
    );
  };

  const onCancel = () => {
    setOpen(false);
  };

  return (
    <Modal
      loadingStatus={isPending ? "active" : "inactive"}
      modalHeading="Edit Ingestion"
      open={open}
      primaryButtonText="Proceed"
      secondaryButtonText="Cancel"
      onRequestClose={onCancel}
      onRequestSubmit={onSubmit}
    >
      <Stack gap={4}>
        <p>
          This will create a new ingestion that will ingest from{" "}
          <b>{schoolConnectivity.api_endpoint}</b> every{" "}
          <b>{schoolConnectivity.ingestion_frequency}</b> minutes
        </p>
        {showErrorNotification && (
          <InlineNotification
            aria-label="create API ingestion error notification"
            kind="error"
            title=""
            subtitle="Operation failed. Please try again"
            statusIconDescription="error"
          />
        )}
      </Stack>
    </Modal>
  );
};

export default ConfirmAddIngestionModal;
