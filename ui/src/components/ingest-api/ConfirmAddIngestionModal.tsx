import { Dispatch, SetStateAction } from "react";

import { Modal } from "@carbon/react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { api } from "@/api";
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

  const { mutateAsync: mutateAsync, isPending } = useMutation({
    mutationFn: api.qos.create_api_ingestion,
  });

  const onSubmit = async () => {
    await mutateAsync({
      school_connectivity: { ...schoolConnectivity, error_message: null },
      school_list: {
        ...schoolList,
        column_to_schema_mapping: JSON.stringify(columnMapping),
        enabled: true,
        error_message: null,
      },
      file: file,
    });

    setOpen(false);
    navigate({ to: "/ingest-api" });
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
