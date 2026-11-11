import { useEffect, useState } from "react";
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
  isNumericDataType,
  parseDomainValues,
  resolveColumnSource,
} from "@/components/schema-management/columnDisplay.ts";
import {
  ColumnSource,
  CreateProposalRequest,
  CriticalFor,
  ProposalType,
  RegistryColumn,
} from "@/types/schemaRegistry.ts";

interface ProposeChangeModalProps {
  datasetKey: string;
  columns: RegistryColumn[];
  open: boolean;
  onClose: () => void;
  initialProposalType?: ProposalType;
  initialColumnName?: string;
  initialColumn?: RegistryColumn;
  /** When true, hide Add/Edit/Delete switcher and lock the column. */
  lockToInitialType?: boolean;
}

interface ProposeChangeInputs {
  proposal_type: ProposalType;
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  is_important: boolean;
  description: string;
  source: "" | ColumnSource;
  is_mandatory: boolean;
  is_unique: boolean;
  range_min: number | undefined;
  range_max: number | undefined;
  precision_min: number | undefined;
  critical_for: "" | CriticalFor;
}

function valuesFromColumn(column?: RegistryColumn) {
  return {
    proposal_type: "edit" as ProposalType,
    column_name: column?.name ?? "",
    data_type: column?.data_type ?? "",
    is_nullable: column?.is_nullable ?? true,
    is_important: column?.is_important ?? false,
    description: column?.description ?? "",
    source: (column ? resolveColumnSource(column) : null) ?? ("" as const),
    is_mandatory: column?.is_mandatory ?? false,
    is_unique: column?.is_unique ?? false,
    range_min: column?.range_min ?? undefined,
    range_max: column?.range_max ?? undefined,
    precision_min: column?.precision_min ?? undefined,
    critical_for: (column?.critical_for ?? "") as "" | CriticalFor,
  };
}

function ProposeChangeModal({
  datasetKey,
  columns,
  open,
  onClose,
  initialProposalType = "add",
  initialColumnName,
  initialColumn,
  lockToInitialType = false,
}: ProposeChangeModalProps) {
  const queryClient = useQueryClient();
  const [showError, setShowError] = useState(false);
  const [domainValueInput, setDomainValueInput] = useState("");
  const [domainValues, setDomainValues] = useState<string[]>([]);

  const { register, handleSubmit, control, watch, reset, trigger, formState } =
    useForm<ProposeChangeInputs>({
      mode: "onChange",
      defaultValues: { proposal_type: "add" },
    });

  const proposalType = watch("proposal_type");
  const dataType = watch("data_type");
  const isMandatory = watch("is_mandatory");
  const supportsRange = isNumericDataType(dataType);
  const supportsPrecision = isNumericDataType(dataType);
  const supportsDomainValues =
    Boolean(dataType) && !isNumericDataType(dataType);

  useEffect(() => {
    if (!supportsDomainValues) {
      setDomainValues([]);
      setDomainValueInput("");
    }
  }, [supportsDomainValues]);

  useEffect(() => {
    if (supportsRange) {
      void trigger(["range_min", "range_max"]);
    }
  }, [supportsRange, trigger]);

  useEffect(() => {
    if (!open) return;

    const seedColumn =
      initialColumn ??
      columns.find(column => column.name === initialColumnName);

    if (initialProposalType === "edit" && seedColumn) {
      reset(valuesFromColumn(seedColumn));
      setDomainValues(
        isNumericDataType(seedColumn.data_type)
          ? []
          : parseDomainValues(seedColumn.domain_values),
      );
    } else if (initialProposalType === "edit" && initialColumnName) {
      reset({
        proposal_type: "edit",
        column_name: initialColumnName,
        data_type: "",
        is_nullable: true,
        is_important: false,
        description: "",
        source: "",
        is_mandatory: false,
        is_unique: false,
        range_min: undefined,
        range_max: undefined,
        precision_min: undefined,
        critical_for: "",
      });
      setDomainValues([]);
    } else if (initialProposalType === "delete") {
      reset({
        proposal_type: "delete",
        column_name: initialColumnName ?? seedColumn?.name ?? "",
        data_type: "",
        is_nullable: true,
        is_important: false,
        description: "",
        source: "",
        is_mandatory: false,
        is_unique: false,
        range_min: undefined,
        range_max: undefined,
        precision_min: undefined,
        critical_for: "",
      });
      setDomainValues([]);
    } else {
      reset({
        proposal_type: "add",
        column_name: "",
        data_type: "",
        is_nullable: true,
        is_important: false,
        description: "",
        source: "",
        is_mandatory: false,
        is_unique: false,
        range_min: undefined,
        range_max: undefined,
        precision_min: undefined,
        critical_for: "",
      });
      setDomainValues([]);
    }
    setDomainValueInput("");
    setShowError(false);
  }, [
    open,
    initialProposalType,
    initialColumnName,
    initialColumn,
    columns,
    reset,
  ]);

  const addDomainValues = (input: string) => {
    // Values are stored pipe-separated, so only split pasted multi-line
    // input on newlines. Commas are allowed inside a single value.
    const values = input
      .split(/\n+/)
      .map(value => value.replace(/\|/g, "").trim())
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
      await queryClient.invalidateQueries({
        queryKey: ["schema-registry", "columns", datasetKey],
      });
      await queryClient.invalidateQueries({
        queryKey: ["schema-registry", "column", datasetKey],
      });
      await queryClient.invalidateQueries({
        queryKey: ["schema-registry", "column-history", datasetKey],
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
      const source = data.source || null;
      body.after_state = {
        data_type: data.data_type,
        is_nullable: data.is_nullable,
        is_important: data.is_important,
        description: data.description || null,
        source,
        is_system_generated:
          source === "system_generated"
            ? true
            : source === "government"
            ? false
            : null,
        is_mandatory: data.is_mandatory,
        is_unique: data.is_unique,
        domain_values:
          supportsDomainValues && domainValues.length > 0
            ? domainValues.join("|")
            : null,
        range_min: supportsRange ? data.range_min ?? null : null,
        range_max: supportsRange ? data.range_max ?? null : null,
        precision_min: supportsPrecision ? data.precision_min ?? null : null,
        critical_for: data.is_mandatory ? data.critical_for || null : null,
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

  const lockedHeading = !lockToInitialType
    ? null
    : initialProposalType === "delete" && initialColumnName
    ? `Delete ${initialColumnName}`
    : initialProposalType === "edit" && initialColumnName
    ? `Edit ${initialColumnName}`
    : initialProposalType === "add"
    ? "Add column"
    : null;

  return (
    <Modal
      aria-label="propose schema change modal"
      hasScrollingContent
      modalHeading={lockedHeading ?? "Propose Schema Change"}
      open={open}
      primaryButtonDisabled={!formState.isValid || isPending}
      primaryButtonText={
        lockToInitialType && initialProposalType === "delete"
          ? "Submit delete proposal"
          : "Submit proposal"
      }
      secondaryButtonText="Cancel"
      danger={lockToInitialType && initialProposalType === "delete"}
      onRequestClose={handleClose}
      onRequestSubmit={handleSubmit(onSubmit)}
    >
      <form aria-label="propose schema change form" className="mb-8">
        <Stack gap={5}>
          {!lockToInitialType && (
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
          )}

          {lockToInitialType && proposalType === "delete" ? (
            <p>
              This creates a proposal to remove <b>{initialColumnName}</b> from
              this schema.
            </p>
          ) : proposalType === "add" ? (
            <TextInput
              id="column_name"
              labelText="Column name"
              {...register("column_name", { required: true })}
            />
          ) : lockToInitialType ? null : (
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
              <Controller
                name="source"
                control={control}
                render={({ field }) => (
                  <Select id="source" labelText="Source" {...field}>
                    <SelectItem text="Not set" value="" />
                    <SelectItem text="Government" value="government" />
                    <SelectItem
                      text="System Generated"
                      value="system_generated"
                    />
                  </Select>
                )}
              />
              <div className="flex flex-wrap gap-4">
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
              {isMandatory && (
                <Controller
                  name="critical_for"
                  control={control}
                  render={({ field }) => (
                    <Select
                      id="critical_for"
                      labelText="Critical for"
                      {...field}
                    >
                      <SelectItem text="Not set" value="" />
                      <SelectItem text="Always" value="always" />
                      <SelectItem text="Create only" value="create_only" />
                    </Select>
                  )}
                />
              )}
              {supportsDomainValues && (
                <div>
                  <TextInput
                    id="domain_values"
                    labelText="Domain values (optional)"
                    helperText="Press Enter after each value. Commas are allowed inside a value; paste multiple values on separate lines."
                    value={domainValueInput}
                    onBlur={() => addDomainValues(domainValueInput)}
                    onChange={event => setDomainValueInput(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addDomainValues(domainValueInput);
                      }
                    }}
                    onPaste={event => {
                      const pastedText = event.clipboardData.getData("text");
                      if (pastedText.includes("\n")) {
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
              )}
              {supportsRange && (
                <div className="flex gap-4">
                  <Controller
                    name="range_min"
                    control={control}
                    rules={{
                      validate: value =>
                        typeof value === "number" && !Number.isNaN(value)
                          ? true
                          : "Range min is required",
                    }}
                    render={({ field, fieldState }) => (
                      <NumberInput
                        id="range_min"
                        label="Range min"
                        allowEmpty
                        invalid={fieldState.invalid}
                        invalidText={fieldState.error?.message}
                        value={field.value ?? ""}
                        onChange={(_, { value }) =>
                          field.onChange(
                            value === "" || value === undefined
                              ? undefined
                              : Number(value),
                          )
                        }
                      />
                    )}
                  />
                  <Controller
                    name="range_max"
                    control={control}
                    rules={{
                      validate: value =>
                        typeof value === "number" && !Number.isNaN(value)
                          ? true
                          : "Range max is required",
                    }}
                    render={({ field, fieldState }) => (
                      <NumberInput
                        id="range_max"
                        label="Range max"
                        allowEmpty
                        invalid={fieldState.invalid}
                        invalidText={fieldState.error?.message}
                        value={field.value ?? ""}
                        onChange={(_, { value }) =>
                          field.onChange(
                            value === "" || value === undefined
                              ? undefined
                              : Number(value),
                          )
                        }
                      />
                    )}
                  />
                </div>
              )}
              {supportsPrecision && (
                <Controller
                  name="precision_min"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      id="precision_min"
                      label="Precision min"
                      allowEmpty
                      value={field.value ?? ""}
                      onChange={(_, { value }) =>
                        field.onChange(
                          value === "" || value === undefined
                            ? undefined
                            : Number(value),
                        )
                      }
                    />
                  )}
                />
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
