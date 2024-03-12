import { Dispatch, SetStateAction } from "react";

import { Modal } from "@carbon/react";

interface InfoIngestionModalModalProps {
  errorMessage: string;
  ingestionName: string;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}
const InfoIngestionModal = ({
  errorMessage,
  ingestionName,
  open,
  setOpen,
}: InfoIngestionModalModalProps) => {
  const handleRequestclose = () => {
    setOpen(false);
  };
  return (
    <Modal
      modalHeading={`${ingestionName} ingestion`}
      open={open}
      onRequestClose={handleRequestclose}
      passiveModal
    >
      {errorMessage}
    </Modal>
  );
};

export default InfoIngestionModal;
