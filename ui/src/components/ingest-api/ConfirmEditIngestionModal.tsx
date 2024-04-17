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
  schoolListId: string;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const ConfirmEditIngestionModal = ({
  schoolListId,
  open,
  setOpen,
}: ConfirmAddIngestionModalInputs) => {
  const {
    apiIngestionSlice: { columnMapping, schoolConnectivity, schoolList },
  } = useStore.getState();

  const navigate = useNavigate({ from: "/ingest-api" });

  const { mutateAsync: mutateAsync, isPending } = useMutation({
    mutationFn: api.qos.update_api_ingestion,
  });

  const onSubmit = async () => {
    await mutateAsync({
      id: schoolListId,
      body: {
        school_connectivity: { ...schoolConnectivity, error_message: null },
        school_list: {
          ...schoolList,
          column_to_schema_mapping: JSON.stringify(columnMapping),
          enabled: true,
          error_message: null,
        },
      },
    });

    setOpen(false);
    void navigate({
      to: "/ingest-api",
      search: {
        page: DEFAULT_PAGE_NUMBER,
        page_size: DEFAULT_PAGE_SIZE,
      },
    });
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
      This will edit a new ingesiton that will ingest from{" "}
      <b>{schoolConnectivity.api_endpoint}</b> every{" "}
      <b>{schoolConnectivity.ingestion_frequency_minutes}</b> minutes
    </Modal>
  );
};

export default ConfirmEditIngestionModal;
