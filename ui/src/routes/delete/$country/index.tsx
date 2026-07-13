import { useState } from "react";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import {
  Button,
  ButtonSet,
  InlineNotification,
  Loading,
  Stack,
} from "@carbon/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { z } from "zod";

import { api } from "@/api";
import { useStore } from "@/context/store";
import { DeleteIdType, DeleteType } from "@/types/delete";

const DeleteSearchParams = z.object({
  idType: z
    .enum(["school_id_giga", "school_id_govt"] as const)
    .catch("school_id_giga"),
  deleteType: z.enum(["specific", "all"] as const).catch("specific"),
});

export const Route = createFileRoute("/delete/$country/")({
  validateSearch: (search: Record<string, unknown>) =>
    DeleteSearchParams.parse(search),
  component: Confirmation,
  loader: ({ location }) => {
    const deleteType = (location.search as { deleteType?: string }).deleteType;
    if (deleteType === "all") return;
    const {
      uploadSlice: { file },
    } = useStore.getState();
    if (!file) {
      throw redirect({ to: ".." });
    }
  },
});

function Confirmation() {
  const [submitError, setSubmitError] = useState<string>("");

  const { country } = Route.useParams();
  const { idType, deleteType } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const isDeleteAll = deleteType === "all";

  const {
    uploadSlice: { detectedColumns: parsedIds, file },
    uploadSliceActions: { resetUploadSliceState },
    appStateActions: { setNotification },
  } = useStore();

  const {
    data: previewData,
    isLoading: isPreviewLoading,
    isError: isPreviewError,
    error: previewError,
  } = useQuery({
    queryKey: [
      "delete-preview",
      country,
      deleteType,
      idType,
      parsedIds,
      isDeleteAll,
    ],
    queryFn: () =>
      api.delete
        .preview_delete_rows({
          country,
          delete_type: deleteType as DeleteType,
          ids: isDeleteAll ? [] : parsedIds,
          id_type: isDeleteAll ? undefined : (idType as DeleteIdType),
        })
        .then(r => r.data),
    enabled: isDeleteAll || parsedIds.length > 0,
    retry: false,
  });

  const schoolCount = previewData?.school_count ?? 0;
  const checkSkipped = previewData?.check_skipped ?? false;

  const {
    mutateAsync: uploadDeleteRowIds,
    isPending,
    isError: isSubmitError,
  } = useMutation({
    mutationKey: ["delete"],
    mutationFn: api.delete.delete_rows,
  });

  const handleOnConfirm = async () => {
    setSubmitError("");

    await uploadDeleteRowIds(
      isDeleteAll
        ? {
            country,
            delete_type: "all",
            school_count_override: schoolCount,
          }
        : {
            country,
            delete_type: "specific",
            ids: parsedIds,
            id_type: idType as DeleteIdType,
            original_filename: file?.name ?? "",
            file,
          },
      {
        onError: err => {
          setSubmitError(err.message);
        },
        onSuccess: () => {
          setNotification(true);
          void navigate({ to: "/delete" });
        },
      },
    );
  };

  const canConfirm =
    !isPreviewLoading &&
    !isPreviewError &&
    previewData != null &&
    (isDeleteAll
      ? schoolCount > 0
      : checkSkipped
      ? parsedIds.length > 0
      : schoolCount > 0);

  return (
    <Stack gap={8}>
      <Stack gap={1}>
        <h2 className="text-[23px]">Confirm school deletion</h2>
        <p>
          School data is the dataset of schools location & their attributes like
          name, education level, internet connection, computer count etc.
        </p>
      </Stack>

      <Stack gap={1}>
        <p className="cds--file--label">
          Country: <span className="cds--label-description">{country}</span>
        </p>
        <p className="cds--file--label">
          Deletion type:{" "}
          <span className="cds--label-description">
            {isDeleteAll ? "All schools" : "Specific schools"}
          </span>
        </p>
        {!isDeleteAll && (
          <>
            <p className="cds--file--label">
              ID type:{" "}
              <span className="cds--label-description">
                {idType === "school_id_giga"
                  ? "Giga ID (school_id_giga)"
                  : "Government ID (school_id_govt)"}
              </span>
            </p>
            <p className="cds--file--label">
              IDs uploaded:{" "}
              <span className="cds--label-description">{parsedIds.length}</span>
            </p>
          </>
        )}
      </Stack>

      {isPreviewLoading && (
        <div className="flex items-center gap-2">
          <Loading small withOverlay={false} />
          <span className="cds--label-description">
            {isDeleteAll
              ? "Counting all schools in Trino…"
              : "Checking affected schools in Trino…"}
          </span>
        </div>
      )}

      {isPreviewError && (
        <InlineNotification
          kind="error"
          title="Preview failed"
          subtitle={
            (previewError as Error)?.message ??
            "Could not check affected schools. Verify the country and try again."
          }
          hideCloseButton
        />
      )}

      {checkSkipped && (
        <InlineNotification
          kind="warning"
          title="Count check skipped"
          subtitle={`Your file contains more than 5,000 IDs. The number of affected schools was not verified in advance. ${parsedIds.length.toLocaleString()} IDs will be submitted for deletion.`}
          hideCloseButton
        />
      )}

      {!isPreviewLoading && !isPreviewError && previewData && !checkSkipped && (
        <InlineNotification
          kind={schoolCount === 0 ? "warning" : isDeleteAll ? "error" : "info"}
          title={
            schoolCount === 0
              ? "No matching schools found"
              : isDeleteAll
              ? `All ${schoolCount.toLocaleString()} schools in ${country} will be permanently deleted`
              : `${schoolCount.toLocaleString()} school${
                  schoolCount !== 1 ? "s" : ""
                } will be deleted`
          }
          subtitle={
            schoolCount === 0
              ? "None of the uploaded IDs matched schools in the database."
              : isDeleteAll
              ? "This action cannot be undone. Ensure you have selected the correct country."
              : `${parsedIds.length} ID${
                  parsedIds.length !== 1 ? "s" : ""
                } uploaded → ${schoolCount} school${
                  schoolCount !== 1 ? "s" : ""
                } matched.`
          }
          hideCloseButton
        />
      )}

      <ButtonSet className="w-full">
        <Button
          kind="secondary"
          as={Link}
          to="/delete"
          onClick={resetUploadSliceState}
          className="w-full"
          renderIcon={ArrowLeft}
          isExpressive
        >
          Cancel
        </Button>
        <Button
          disabled={isPending || !canConfirm}
          kind={isDeleteAll ? "danger" : "primary"}
          className="w-full"
          renderIcon={
            isPending
              ? props => <Loading small={true} withOverlay={false} {...props} />
              : ArrowRight
          }
          isExpressive
          onClick={handleOnConfirm}
        >
          {isDeleteAll ? "Delete all schools" : "Confirm deletion"}
        </Button>
      </ButtonSet>

      {isSubmitError && (
        <div className="cds--label-description text-giga-red">
          {submitError}
        </div>
      )}
    </Stack>
  );
}
