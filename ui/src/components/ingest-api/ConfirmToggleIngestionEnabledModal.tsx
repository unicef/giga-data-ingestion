import { Dispatch, SetStateAction } from "react";

import { Modal } from "@carbon/react";
import { useMutation } from "@tanstack/react-query";
import { AxiosResponse } from "axios";

import { api, queryClient } from "@/api";
import { PagedSchoolListResponse } from "@/types/qos";

import { LoadingStates } from "./IngestTable";

interface ConfirmEnableIngestionModalProps {
  ingestionName: string;
  mutationQueryKey: number[];
  open: boolean;
  setLoadingStates: Dispatch<SetStateAction<LoadingStates>>;
  setOpen: Dispatch<SetStateAction<boolean>>;
  schoolListId: string;
  isIngestionActive: boolean;
}

const ConfirmToggleIngestionEnabledModal = ({
  ingestionName,
  isIngestionActive,
  mutationQueryKey,
  open,
  schoolListId,
  setLoadingStates,
  setOpen,
}: ConfirmEnableIngestionModalProps) => {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: api.qos.update_school_list_status,
    onMutate: async (schoolIdStatus: { id: string; enabled: boolean }) => {
      setLoadingStates(prev => ({ ...prev, [schoolIdStatus.id]: true }));

      await queryClient.cancelQueries({
        queryKey: ["school_list", ...mutationQueryKey],
      });

      const previousSchoolList = queryClient.getQueryData([
        "school_list",
        ...mutationQueryKey,
      ]);

      queryClient.setQueryData(
        ["school_list", ...mutationQueryKey],
        (old: AxiosResponse<PagedSchoolListResponse>) => {
          const newSchoolListStatus = old.data.data.find(
            item => item.id === schoolIdStatus.id,
          );

          if (newSchoolListStatus) {
            const newData = {
              ...old,
              data: {
                ...old.data,
                data: old.data.data.map(item =>
                  item.id === schoolIdStatus.id
                    ? { ...item, enabled: schoolIdStatus.enabled }
                    : item,
                ),
              },
            };
            return newData;
          }

          return old;
        },
      );

      return { previousSchoolList };
    },

    onSettled: (_, __, schoolIdStatus) => {
      setLoadingStates(prev => ({ ...prev, [schoolIdStatus.id]: false }));
      queryClient.invalidateQueries({
        queryKey: ["school_list", ...mutationQueryKey],
      });
    },
  });

  const onClose = () => {
    setOpen(false);
  };

  const onSubmit = async () => {
    if (isIngestionActive) {
      await mutateAsync({
        id: schoolListId,
        enabled: false,
      });
    }

    if (!isIngestionActive) {
      await mutateAsync({
        id: schoolListId,
        enabled: true,
      });
    }

    setOpen(false);
  };

  const ENABLE_HEADER = `Activate ${ingestionName} ingestion`;
  const ENABLE_MESSAGE = (
    <>
      <p>
        Activating an API ingestion will run the ingestion immediately, and it
        will rerun based on the input frequency until it is stopped. All runs
        will incur the corresponding costs in the databases. Please make sure
        that the API ingestion has been correctly set up before triggering an
        ingestion.
      </p>
      <p>Are you sure you want to proceed?</p>
    </>
  );
  const DISABLE_HEADER = `Deactivate ${ingestionName} ingestion`;
  const DISABLE_MESSAGE = (
    <>
      <p>
        Deactivating an API ingestion will stop the ingestion from running
        automatically based on the input frequency. It will not run again until
        it is manually activated again by a user.
      </p>
      <p>Are you sure you want to proceed?</p>
    </>
  );

  return (
    <Modal
      loadingStatus={isPending ? "active" : "inactive"}
      modalHeading={isIngestionActive ? DISABLE_HEADER : ENABLE_HEADER}
      open={open}
      primaryButtonText="Proceed"
      secondaryButtonText="Cancel"
      onRequestClose={onClose}
      onRequestSubmit={onSubmit}
    >
      {isIngestionActive ? DISABLE_MESSAGE : ENABLE_MESSAGE}
    </Modal>
  );
};
export default ConfirmToggleIngestionEnabledModal;
