import { Dispatch, SetStateAction } from "react";

import { Modal } from "@carbon/react";
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
  } = useStore.getState();
  const navigate = useNavigate({ from: "/ingest-api" });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: api.qos.create_api_ingestion,
  });

  const onSubmit = async () => {
    const correctedColumnMapping = Object.fromEntries(
      Object.entries(columnMapping).map(([key, value]) => [value, key]),
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
      },
    );
  };

  const onCancel = () => {
    setOpen(false);
  };

  return (
    <Modal
      loadingStatus={isPending ? "active" : "inactive"}
      modalHeading="Create New Ingestion"
      open={open}
      primaryButtonText="Proceed"
      secondaryButtonText="Cancel"
      onRequestClose={onCancel}
      onRequestSubmit={onSubmit}
    >
      This will create a new ingesiton that will ingest from{" "}
      <b>{schoolConnectivity.api_endpoint}</b> every{" "}
      <b>{schoolConnectivity.ingestion_frequency_minutes}</b> minutes
    </Modal>
  );
};

export default ConfirmAddIngestionModal;
