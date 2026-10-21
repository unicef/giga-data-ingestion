import { useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

import {
  Checkbox,
  InlineNotification,
  Modal,
  NumberInput,
  SelectItem,
  Stack,
  Tag,
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
  range_min: number | undefined;
  range_max: number | undefined;
}

const NUMERIC_DATA_TYPES = new Set(["integer", "long", "float", "double"]);

function ProposeChangeModal({
  datasetKey,
  columns,
  open,
  onClose,
}: ProposeChangeModalProps) {
  const queryClient = useQueryClient();
  const [showError, setShowError] = useState(false);
  const [domainValueInput, setDomainValueInput] = useState("");
  const [domainValues, setDomainValues] = useState<string[]>([]);

  const { register, handleSubmit, control, watch, reset, formState } =
    useForm<ProposeChangeInputs>({
      mode: "onChange",
      defaultValues: { proposal_type: "add" },
    });

  const proposalType = watch("proposal_type");
  const dataType = watch("data_type");
  const supportsRange = NUMERIC_DATA_TYPES.has(dataType);

  const addDomainValues = (input: string) => {
    const values = input
      .split(/[,\n]+/)
      .map(value => value.trim())
      .filter(Boolean);

    if (values.length > 0) {
      setDomainValues(currentValues => [
        ...currentValues,
        ...values.filter(value => !currentValues.includes(value)),
      ]);
    }
    setDomainValueInput("");
  };

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
    setDomainValueInput("");
    setDomainValues([]);
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
        domain_values: domainValues.length > 0 ? domainValues.join("|") : null,
        range_min: supportsRange ? data.range_min ?? null : null,
        range_max: supportsRange ? data.range_max ?? null : null,
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
              <Select
                id="data_type"
                labelText="Data type"
                {...register("data_type", { required: true })}
              >
                <SelectItem text="Select a data type" value="" />
                <SelectItem text="String" value="string" />
                <SelectItem text="Integer" value="integer" />
                <SelectItem text="Long" value="long" />
                <SelectItem text="Float" value="float" />
                <SelectItem text="Double" value="double" />
                <SelectItem text="Timestamp" value="timestamp" />
                <SelectItem text="Boolean" value="boolean" />
              </Select>
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
              <div>
                <TextInput
                  id="domain_values"
                  labelText="Domain values (optional)"
                  helperText="Press Enter after each value. You can also paste comma- or line-separated values."
                  value={domainValueInput}
                  onBlur={() => addDomainValues(domainValueInput)}
                  onChange={event => setDomainValueInput(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === "Enter" || event.key === ",") {
                      event.preventDefault();
                      addDomainValues(domainValueInput);
                    }
                  }}
                  onPaste={event => {
                    const pastedText = event.clipboardData.getData("text");
                    if (/[\n,]/.test(pastedText)) {
                      event.preventDefault();
                      addDomainValues(pastedText);
                    }
                  }}
                />
                {domainValues.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {domainValues.map(value => (
                      <Tag
                        key={value}
                        filter
                        type="blue"
                        onClose={() =>
                          setDomainValues(currentValues =>
                            currentValues.filter(item => item !== value),
                          )
                        }
                      >
                        {value}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
              {supportsRange && (
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
              )}
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
