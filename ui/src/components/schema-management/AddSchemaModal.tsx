import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import {
  Button,
  InlineNotification,
  Modal,
  Select,
  SelectItem,
  Stack,
  TextArea,
  TextInput,
} from "@carbon/react";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { api } from "@/api";
import { FileUploaderDropContainer } from "@/components/common/CarbonOverrides.tsx";
import {
  CreateSchemaDatasetRequest,
  SchemaDataset,
  SchemaRole,
} from "@/types/schemaRegistry.ts";

interface AddSchemaModalProps {
  groupId: string;
  open: boolean;
  onClose: () => void;
  onCreated: (dataset: SchemaDataset) => void;
}

interface AddSchemaInputs {
  key: string;
  name: string;
  description: string;
  role: SchemaRole;
  creation_method: "csv" | "empty";
}

interface ApiErrorResponse {
  detail?: string | { row?: number; detail: string }[];
}

function createSchemaErrorMessage(error: unknown) {
  const detail =
    error instanceof AxiosError
      ? (error.response?.data as ApiErrorResponse | undefined)?.detail
      : undefined;

  if (Array.isArray(detail)) {
    return detail
      .map(item => `${item.row ? `Row ${item.row}: ` : ""}${item.detail}`)
      .join(" ");
  }
  return (
    detail || "Check the key, group role, and CSV contents, then try again."
  );
}

const csvTemplateHeaders = [
  "name",
  "data_type",
  "is_nullable",
  "is_important",
  "is_system_generated",
  "description",
  "primary_key",
  "partition_order",
  "license",
  "units",
  "hint",
  "is_mandatory",
  "is_unique",
  "domain_values",
  "range_min",
  "range_max",
  "dynamic_max",
  "precision_min",
  "critical_for",
];

function downloadCsvTemplate() {
  const csv = `${csvTemplateHeaders.join(",")}\n`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "schema-template.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function AddSchemaModal({
  groupId,
  open,
  onClose,
  onCreated,
}: AddSchemaModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { register, handleSubmit, reset, watch, formState } =
    useForm<AddSchemaInputs>({
      mode: "onChange",
      defaultValues: { role: "member", creation_method: "csv" },
    });
  const creationMethod = watch("creation_method");
  const role = watch("role");

  const { mutateAsync: createSchema, isPending } = useMutation({
    mutationFn: async ({
      body,
      csvFile,
    }: {
      body: CreateSchemaDatasetRequest;
      csvFile: File | null;
    }) => {
      if (csvFile) {
        const response = await api.schemaRegistry.createDatasetFromCsv({
          ...body,
          file: csvFile,
        });
        return response.data.dataset;
      }
      const response = await api.schemaRegistry.createDataset(body);
      return response.data;
    },
  });

  const close = () => {
    reset();
    setFile(null);
    setErrorMessage(null);
    onClose();
  };

  const onSubmit: SubmitHandler<AddSchemaInputs> = async inputs => {
    setErrorMessage(null);
    try {
      const dataset = await createSchema({
        body: {
          key: inputs.key,
          name: inputs.name || null,
          description: inputs.description || null,
          group_id: groupId,
          role: inputs.role,
        },
        csvFile: creationMethod === "csv" ? file : null,
      });
      close();
      onCreated(dataset);
    } catch (error) {
      console.error(error);
      setErrorMessage(createSchemaErrorMessage(error));
    }
  };

  return (
    <Modal
      aria-label="add schema modal"
      hasScrollingContent
      modalHeading="Add schema"
      open={open}
      primaryButtonDisabled={
        !formState.isValid ||
        isPending ||
        (creationMethod === "csv" && file === null)
      }
      primaryButtonText={
        isPending
          ? "Creating…"
          : creationMethod === "csv"
          ? "Create and publish v1"
          : "Create schema"
      }
      secondaryButtonText="Cancel"
      onRequestClose={close}
      onRequestSubmit={handleSubmit(onSubmit)}
    >
      <form aria-label="add schema form" className="mb-8">
        <Stack gap={5}>
          <TextInput
            id="schema-key"
            labelText="Schema key"
            helperText="Used by upload and pipeline integrations, for example school_geolocation."
            {...register("key", { required: true })}
          />
          <TextInput
            id="schema-name"
            labelText="Display name"
            {...register("name")}
          />
          <TextArea
            id="schema-description"
            labelText="Description"
            {...register("description")}
          />
          <Select id="schema-role" labelText="Role" {...register("role")}>
            <SelectItem value="member" text="Member schema" />
            <SelectItem value="core" text="Shared core schema" />
          </Select>
          <Select
            id="schema-creation-method"
            labelText="Initial columns"
            {...register("creation_method")}
          >
            <SelectItem value="csv" text="Upload a CSV and publish v1" />
            <SelectItem value="empty" text="Start with an empty schema" />
          </Select>
          {creationMethod === "csv" && (
            <div>
              <FileUploaderDropContainer
                accept={[".csv"]}
                labelText={
                  file
                    ? file.name
                    : "Drag and drop a schema CSV or click to browse"
                }
                multiple={false}
                name="schema-csv"
                onAddFiles={(_, { addedFiles }: { addedFiles: File[] }) =>
                  setFile(addedFiles[0] ?? null)
                }
              />
              <Button
                className="mt-2"
                kind="ghost"
                size="sm"
                type="button"
                onClick={downloadCsvTemplate}
              >
                Download CSV template
              </Button>
              {role === "member" && (
                <p className="mt-2 text-sm text-giga-dark-gray">
                  Omit columns inherited from this group&apos;s core schema.
                </p>
              )}
            </div>
          )}
          {errorMessage && (
            <InlineNotification
              kind="error"
              title="Could not create schema"
              subtitle={errorMessage}
              onCloseButtonClick={() => setErrorMessage(null)}
            />
          )}
        </Stack>
      </form>
    </Modal>
  );
}

export default AddSchemaModal;
