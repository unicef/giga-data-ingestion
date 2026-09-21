import { useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

import {
  Checkbox,
  InlineNotification,
  Modal,
  NumberInput,
  SelectItem,
  Stack,
  TextInput,
} from "@carbon/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/api";
import { Select } from "@/components/forms/Select.tsx";
import {
  CreateProposalRequest,
  ProposalType,
  RegistryColumn,
} from "@/types/schemaRegistry.ts";

interface ProposeChangeModalProps {
  datasetKey: string;
  columns: RegistryColumn[];
  open: boolean;
  onClose: () => void;
}

interface ProposeChangeInputs {
  proposal_type: ProposalType;
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  is_important: boolean;
  description: string;
  is_mandatory: boolean;
  is_unique: boolean;
  domain_values: string;
  range_min: number | undefined;
  range_max: number | undefined;
}

function ProposeChangeModal({
  datasetKey,
  columns,
  open,
  onClose,
}: ProposeChangeModalProps) {
  const queryClient = useQueryClient();
  const [showError, setShowError] = useState(false);

  const { register, handleSubmit, control, watch, reset, formState } =
    useForm<ProposeChangeInputs>({
      mode: "onChange",
      defaultValues: { proposal_type: "add" },
    });

  const proposalType = watch("proposal_type");

  const { mutateAsync: createProposal, isPending } = useMutation({
    mutationFn: api.schemaRegistry.createProposal,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["schema-registry", "proposals"],
      });
    },
  });

  const handleClose = () => {
    reset();
    setShowError(false);
    onClose();
  };

  const onSubmit: SubmitHandler<ProposeChangeInputs> = async data => {
    const body: CreateProposalRequest = {
      column_name: data.column_name,
      proposal_type: data.proposal_type,
    };

    if (data.proposal_type !== "delete") {
      body.after_state = {
        data_type: data.data_type,
        is_nullable: data.is_nullable,
        is_important: data.is_important,
        description: data.description || null,
        is_mandatory: data.is_mandatory,
        is_unique: data.is_unique,
        domain_values: data.domain_values || null,
        range_min: data.range_min ?? null,
        range_max: data.range_max ?? null,
      };
    }

    try {
      await createProposal({ datasetKey, body });
      handleClose();
    } catch (err) {
      console.error(err);
      setShowError(true);
    }
  };

  return (
    <Modal
      aria-label="propose schema change modal"
      hasScrollingContent
      modalHeading="Propose Schema Change"
      open={open}
      primaryButtonDisabled={!formState.isValid || isPending}
      primaryButtonText="Submit proposal"
      secondaryButtonText="Cancel"
      onRequestClose={handleClose}
      onRequestSubmit={handleSubmit(onSubmit)}
    >
      <form aria-label="propose schema change form" className="mb-8">
        <Stack gap={5}>
          <Controller
            name="proposal_type"
            control={control}
            render={({ field }) => (
              <Select id="proposal_type" labelText="Change type" {...field}>
                <SelectItem text="Add column" value="add" />
                <SelectItem text="Edit column" value="edit" />
                <SelectItem text="Delete column" value="delete" />
              </Select>
            )}
          />

          {proposalType === "add" ? (
            <TextInput
              id="column_name"
              labelText="Column name"
              {...register("column_name", { required: true })}
            />
          ) : (
            <Controller
              name="column_name"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select id="column_name" labelText="Column" {...field}>
                  <SelectItem text="Select a column" value="" />
                  {columns.map(column => (
                    <SelectItem
                      key={column.name}
                      text={column.name}
                      value={column.name}
                    />
                  ))}
                </Select>
              )}
            />
          )}

          {proposalType !== "delete" && (
            <>
              <TextInput
                id="data_type"
                labelText="Data type"
                {...register("data_type", { required: true })}
              />
              <TextInput
                id="description"
                labelText="Description"
                {...register("description")}
              />
              <div className="flex gap-4">
                <Checkbox
                  id="is_nullable"
                  labelText="Nullable"
                  {...register("is_nullable")}
                />
                <Checkbox
                  id="is_important"
                  labelText="Important"
                  {...register("is_important")}
                />
                <Checkbox
                  id="is_mandatory"
                  labelText="Mandatory (DQ)"
                  {...register("is_mandatory")}
                />
                <Checkbox
                  id="is_unique"
                  labelText="Unique (DQ)"
                  {...register("is_unique")}
                />
              </div>
              <TextInput
                id="domain_values"
                labelText="Domain values (pipe-delimited)"
                {...register("domain_values")}
              />
              <div className="flex gap-4">
                <Controller
                  name="range_min"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      id="range_min"
                      label="Range min"
                      value={field.value ?? ""}
                      onChange={(_, { value }) => field.onChange(value)}
                    />
                  )}
                />
                <Controller
                  name="range_max"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      id="range_max"
                      label="Range max"
                      value={field.value ?? ""}
                      onChange={(_, { value }) => field.onChange(value)}
                    />
                  )}
                />
              </div>
            </>
          )}

          {showError && (
            <InlineNotification
              kind="error"
              title="Could not submit proposal"
              subtitle="A pending proposal may already exist for this column."
              onCloseButtonClick={() => setShowError(false)}
            />
          )}
        </Stack>
      </form>
    </Modal>
  );
}

export default ProposeChangeModal;
