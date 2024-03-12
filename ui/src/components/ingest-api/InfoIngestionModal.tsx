import { Dispatch, SetStateAction } from "react";

import { Modal } from "@carbon/react";

interface InfoIngestionModalModalProps {
  ingestionDate: Date;
  errorMessage: string;
  ingestionName: string;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}
const InfoIngestionModal = ({
  errorMessage,
  ingestionDate,
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
      <p>
        Run on{" "}
        {ingestionDate ? new Date(ingestionDate).toLocaleString() : "N/A"}
      </p>
      <p>{errorMessage}</p>
    </Modal>
  );
};

export default InfoIngestionModal;
