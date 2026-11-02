import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import {
  InlineNotification,
  Modal,
  Stack,
  TextArea,
  TextInput,
} from "@carbon/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/api";
import { CreateDatasetGroupRequest } from "@/types/schemaRegistry.ts";

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
}

function CreateGroupModal({ open, onClose }: CreateGroupModalProps) {
  const queryClient = useQueryClient();
  const [showError, setShowError] = useState(false);

  const { register, handleSubmit, reset, formState } =
    useForm<CreateDatasetGroupRequest>({ mode: "onChange" });

  const { mutateAsync: createGroup, isPending } = useMutation({
    mutationFn: api.schemaRegistry.createGroup,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["schema-registry", "groups"],
      });
    },
  });

  const handleClose = () => {
    reset();
    setShowError(false);
    onClose();
  };

  const onSubmit: SubmitHandler<CreateDatasetGroupRequest> = async data => {
    try {
      await createGroup(data);
      handleClose();
    } catch (err) {
      console.error(err);
      setShowError(true);
    }
  };

  return (
    <Modal
      aria-label="create dataset group modal"
      modalHeading="New dataset group"
      open={open}
      primaryButtonText="Create group"
      primaryButtonDisabled={!formState.isValid || isPending}
      secondaryButtonText="Cancel"
      onRequestClose={handleClose}
      onRequestSubmit={handleSubmit(onSubmit)}
    >
      <form aria-label="create dataset group form" className="mb-4">
        <Stack gap={5}>
          <TextInput
            id="new-group-key"
            labelText="Key"
            {...register("key", { required: true })}
          />
          <TextInput
            id="new-group-name"
            labelText="Name"
            {...register("name", { required: true })}
          />
          <TextArea
            id="new-group-description"
            labelText="Description"
            {...register("description")}
          />
          {showError && (
            <InlineNotification
              kind="error"
              title="Could not create group"
              subtitle="A group with that key may already exist."
              onCloseButtonClick={() => setShowError(false)}
            />
          )}
        </Stack>
      </form>
    </Modal>
  );
}

export default CreateGroupModal;
