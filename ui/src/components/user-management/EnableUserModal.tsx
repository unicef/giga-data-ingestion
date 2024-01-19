import { useCallback, useState } from "react";
import toast from "react-hot-toast";

import { useMutation } from "@tanstack/react-query";
import { Alert, Modal } from "antd";

import { useApi } from "@/api";
import { GraphUser } from "@/types/user";

interface EnableUserModalProps {
  initialValues: GraphUser;
  isEnableUserModalOpen: boolean;
  setIsEnableUserModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function EnableUserModal({
  initialValues,
  isEnableUserModalOpen,
  setIsEnableUserModalOpen,
}: EnableUserModalProps) {
  const api = useApi();

  const [confirmLoading, setConfirmLoading] = useState(false);
  const [error, setError] = useState(false);
  const revokeUser = useMutation({
    mutationFn: api.users.edit_user,
  });

  const handleOk = useCallback(async () => {
    setConfirmLoading(true);
    try {
      await revokeUser.mutateAsync({
        account_enabled: true,
        id: initialValues.id,
      });

      toast.success(
        "User successfully enabled. Please wait a moment or refresh the page for updates",
      );

      setIsEnableUserModalOpen(false);
    } catch (err) {
      toast.error("Operation failed, please try again");

      setError(true);
    } finally {
      setConfirmLoading(false);
    }
  }, [revokeUser, setIsEnableUserModalOpen, initialValues.id]);

  return (
    <Modal
      centered={true}
      confirmLoading={confirmLoading}
      okButtonProps={{ className: "rounded-none bg-primary" }}
      open={isEnableUserModalOpen}
      title="Confirm user access modification"
      width="60%"
      onCancel={() => {
        setIsEnableUserModalOpen(false);
      }}
      onOk={handleOk}
    >
      <div>
        <p>
          This will re-enable acces of the user with email{" "}
          <b>{initialValues.mail}</b> to the whole Giga platform
        </p>
        <br />

        <p>Are you sure you want to do this?</p>
        {error && (
          <Alert message="Operation failed, please try again" type="error" />
        )}
      </div>
    </Modal>
  );
}
