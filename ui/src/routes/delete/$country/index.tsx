import { useState } from "react";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import {
  Button,
  ButtonSet,
  ListItem,
  Loading,
  Stack,
  UnorderedList,
} from "@carbon/react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

import { api } from "@/api";
import { useStore } from "@/context/store";

export const Route = createFileRoute("/delete/$country/")({
  component: Confirmation,
  loader: () => {
    const {
      uploadSlice: { file },
    } = useStore.getState();
    if (!file) {
      throw redirect({ to: ".." });
    }
  },
});

function Confirmation() {
  const [error, setError] = useState<string>("");

  const { country } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });

  const {
    uploadSlice: { detectedColumns: ids },
    uploadSliceActions: { resetUploadSliceState },
    appStateActions: { setNotificiation },
  } = useStore();

  const {
    mutateAsync: uploadDeleteRowIds,
    isPending,
    isError,
  } = useMutation({
    mutationKey: ["delete"],
    mutationFn: api.delete.delete_rows,
  });
  const handleOnConfirm = async () => {
    setError("");

    await uploadDeleteRowIds(
      { country: country, ids: ids },
      {
        onError: err => {
          setError(err.message);
        },
        onSuccess: () => {
          setNotificiation(true);
          void navigate({ to: "../../.." });
        },
      },
    );
  };

  return (
    <Stack gap={8}>
      <Stack gap={1}>
        <h2 className="text-[23px] ">
          Confirm that the following school IDs from the provided country will be
          deleted
        </h2>
        <p>
          School data is the dataset of schools location & their attributes like name,
          education level, internet connection, computer count etc.
        </p>
      </Stack>

      <Stack gap={1}>
        <p className="cds--file--label">
          Country: <span className="cds--label-description">{country}</span>
        </p>
        <p className="cds--file--label">School IDs</p>
        <UnorderedList>
          {ids.map(id => (
            <ListItem key={id}>{id}</ListItem>
          ))}
        </UnorderedList>
      </Stack>
      <ButtonSet className="w-full">
        <Button
          kind="secondary"
          as={Link}
          to={`/delete/${country}`}
          onClick={resetUploadSliceState}
          className="w-full"
          renderIcon={ArrowLeft}
          isExpressive
        >
          Cancel
        </Button>
        <Button
          disabled={isPending}
          as={Link}
          className="w-full"
          renderIcon={
            isPending
              ? props => <Loading small={true} withOverlay={false} {...props} />
              : ArrowRight
          }
          isExpressive
          onClick={handleOnConfirm}
        >
          Confirm
        </Button>
      </ButtonSet>
      {isError && <div className="cds--label-description text-giga-red">{error}</div>}
    </Stack>
  );
}
