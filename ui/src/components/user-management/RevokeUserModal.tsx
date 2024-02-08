import { useCallback, useState } from "react";

import { InlineNotification, Modal, ToastNotification } from "@carbon/react";
import { useMutation } from "@tanstack/react-query";

import { useApi } from "@/api";
import { GraphUser } from "@/types/user";

interface RevokeUserModalProps {
  initialValues: GraphUser;
  isRevokeModalOpen: boolean;
  setIsRevokeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function RevokeUserModal({
  initialValues,
  isRevokeModalOpen,
  setIsRevokeModalOpen,
}: RevokeUserModalProps) {
  const api = useApi();

  const [error, setError] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const revokeUser = useMutation({
    mutationFn: api.users.edit_user,
  });

  const handleSubmit = useCallback(async () => {
    try {
      await revokeUser.mutateAsync({
        account_enabled: false,
        id: initialValues.id,
      });

      setShowSuccessNotification(true);
      setIsRevokeModalOpen(false);
    } catch (err) {
      setError(true);
    }
  }, [revokeUser, setIsRevokeModalOpen, initialValues.id]);

  return (
    <>
      <Modal
        aria-label="confirm revoke user modal"
        loadingStatus={revokeUser.isPending ? "active" : "inactive"}
        modalHeading="Confirm Revoke User"
        open={isRevokeModalOpen}
        primaryButtonText="Confirm"
        secondaryButtonText="Cancel"
        onRequestClose={() => setIsRevokeModalOpen(false)}
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
