import { Dispatch, SetStateAction } from "react";

import { Modal } from "@carbon/react";

import { useQosStore } from "@/context/qosStore";

interface ConfirmAddIngestionModalInputs {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const ConfirmAddIngestionModal = ({
  open,
  setOpen,
}: ConfirmAddIngestionModalInputs) => {
  const { schoolConnectivity } = useQosStore.getState();

  const onSubmit = () => {
    // TODO: Add call to routes and onLoaders

    setOpen(false);
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
      <b>{schoolConnectivity.apiEndpoint}</b> every{" "}
      <b>{schoolConnectivity.ingestionFrequency}</b> minutes
    </Modal>
  );
};

export default ConfirmAddIngestionModal;
