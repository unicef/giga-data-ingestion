import { type Dispatch, type SetStateAction, useState } from "react";

import { InlineNotification, Modal, Stack } from "@carbon/react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { api } from "@/api";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination.ts";
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

  const [showErrorNotification, setShowErrorNotification] = useState(false);

  const navigate = useNavigate({
    from: "/ingest-api/edit/$ingestionId/school-connectivity",
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: api.qos.update_api_ingestion,
    mutationKey: ["school_list"],
  });

  const onSubmit = async () => {
    setShowErrorNotification(false);

    await mutateAsync(
      {
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
      modalHeading="Create New Ingestion"
      open={open}
      primaryButtonText="Proceed"
      secondaryButtonText="Cancel"
      onRequestClose={onCancel}
      onRequestSubmit={onSubmit}
    >
      <Stack gap={4}>
        <p>
          This will edit the API ingestion for <b>{schoolConnectivity.api_endpoint}</b>,
          which ingests every <b>{schoolConnectivity.ingestion_frequency}</b> minutes.
        </p>
        {showErrorNotification && (
          <InlineNotification
            aria-label="edit API ingestion error notification"
            kind="error"
            statusIconDescription="error"
            title=""
            subtitle="Operation failed. Please try again"
            className="w-full"
          />
        )}
      </Stack>
    </Modal>
  );
};

export default ConfirmEditIngestionModal;
