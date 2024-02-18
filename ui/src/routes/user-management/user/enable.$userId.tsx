import { useCallback, useState } from "react";

import { InlineNotification, Modal, ToastNotification } from "@carbon/react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { api, queryClient } from "@/api";

export const Route = createFileRoute("/user-management/user/enable/$userId")({
  component: EnableUser,
  loader: ({ params: { userId } }) => {
    return queryClient.ensureQueryData({
      queryKey: ["user", userId],
      queryFn: () => api.users.get(userId),
    });
  },
});

function EnableUser() {
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
        account_enabled: true,
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
        aria-label="confirm enable user modal"
        loadingStatus={revokeUser.isPending ? "active" : "inactive"}
        modalHeading="Confirm Revoke User"
        primaryButtonText="Confirm"
        secondaryButtonText="Cancel"
        onRequestClose={async () => await navigate({ to: "../../.." })}
        onRequestSubmit={handleSubmit}
      >
        <div>
          <p>
            This will re-enable access of the user with email{" "}
            <b>{initialValues.mail}</b> to the whole Giga platform
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
          aria-label="enable user success notification"
          kind="success"
          caption="User successfully enabled. Please wait a moment or refresh the page for updates"
          onClose={() => setShowSuccessNotification(false)}
          onCloseButtonClick={() => setShowSuccessNotification(false)}
          statusIconDescription="success"
          timeout={5000}
          title="Enable user success"
          className="absolute right-0 top-0 z-50 mx-6 my-16"
        />
      )}
    </>
  );
}
