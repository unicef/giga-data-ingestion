import { useCallback, useState } from "react";

import { InlineNotification, Modal, ToastNotification } from "@carbon/react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { api } from "@/api";
import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { PendingComponent } from "@/components/common/PendingComponent.tsx";

export const Route = createFileRoute("/user-management/user/revoke/$userId")({
  component: RevokeUser,
  loader: ({ params: { userId }, context: { queryClient } }) => {
    return queryClient.ensureQueryData({
      queryKey: ["user", userId],
      queryFn: () => api.users.get(userId),
    });
  },
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

function RevokeUser() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { userId } = Route.useParams();
  const {
    data: { data: initialValues },
  } = useSuspenseQuery({
    queryKey: ["user", userId],
    queryFn: () => api.users.get(userId),
  });

  const [error, setError] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  const revokeUser = useMutation({
    mutationFn: api.users.editUser,
  });

  const handleSubmit = useCallback(async () => {
    try {
      await revokeUser.mutateAsync({
        account_enabled: false,
        id: initialValues.id,
      });

      setShowSuccessNotification(true);
      await navigate({ to: "../../.." });
    } catch (err) {
      setError(true);
    }
  }, [revokeUser, initialValues.id, navigate]);

  return (
    <>
      <Modal
        open
        aria-label="confirm revoke user modal"
        loadingStatus={revokeUser.isPending ? "active" : "inactive"}
        modalHeading="Confirm Revoke User"
        primaryButtonText="Confirm"
        secondaryButtonText="Cancel"
        onRequestClose={async () => await navigate({ to: "../../.." })}
        onRequestSubmit={handleSubmit}
      >
        <div>
          <p>
            This will revoke access of the user with email{" "}
            <b>{initialValues.mail}</b> to the whole Giga platform, meaning they
            won't be able to access any part of the Giga platform
          </p>
          <br />

          <p>Are you sure you want to do this?</p>
          {error && (
            <InlineNotification
              aria-label="create user error notification"
              hideCloseButton
              kind="error"
              statusIconDescription="notification"
              subtitle="Operation failed. Please try again."
              title="Error"
            />
          )}
        </div>
      </Modal>

      {showSuccessNotification && (
        <ToastNotification
          aria-label="revoke user success notification"
          kind="success"
          caption="User successfully revoked. Please wait a moment or refresh the page for updates"
          onClose={() => setShowSuccessNotification(false)}
          onCloseButtonClick={() => setShowSuccessNotification(false)}
          statusIconDescription="success"
          timeout={5000}
          title="Revoke user success"
          className="absolute right-0 top-0 z-50 mx-6 my-16"
        />
      )}
    </>
  );
}
