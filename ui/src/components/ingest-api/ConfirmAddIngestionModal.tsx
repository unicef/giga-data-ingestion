import { Dispatch, SetStateAction } from "react";

import { Modal } from "@carbon/react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { api } from "@/api";
import { useQosStore } from "@/context/qosStore";

interface ConfirmAddIngestionModalInputs {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const ConfirmAddIngestionModal = ({
  open,
  setOpen,
}: ConfirmAddIngestionModalInputs) => {
  const { schoolConnectivity, schoolList, columnMapping } =
    useQosStore.getState();
  const navigate = useNavigate({ from: "/ingest-api" });

  const addIngestion = useMutation({
    mutationFn: api.qos.create_api_ingestion,
  });

  const onSubmit = async () => {
    // TODO: Add  onLoaders

    console.log(schoolConnectivity);
    console.log(schoolList);

    await addIngestion.mutateAsync({
      school_connectivity: schoolConnectivity,
      school_list: {
        ...schoolList,
        column_to_schema_mapping: JSON.stringify(columnMapping),
      },
    });

    setOpen(false);
    navigate({ to: "/ingest-api" });
  };

  const onCancel = () => {
    setOpen(false);
  };

  return (
    <Modal
      modalHeading="Create New Ingestion"
      open={open}
      primaryButtonText="Proceed"
      secondaryButtonText="Cancel"
      onRequestClose={onCancel}
      onRequestSubmit={onSubmit}
    >
      This will create a new ingesiton that will ingest from{" "}
      <b>{schoolConnectivity.api_endpoint}</b> every{" "}
      <b>{schoolConnectivity.ingestion_frequency}</b> minutes
    </Modal>
  );
};

export default ConfirmAddIngestionModal;
