import { useCallback, useState } from "react";
import toast from "react-hot-toast";

import { useMutation } from "@tanstack/react-query";
import { Alert, Modal } from "antd";

import { useApi } from "@/api";
import { modalWidth } from "@/constants/theme";
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

  const [confirmLoading, setConfirmLoading] = useState(false);
  const [error, setError] = useState(false);
  const revokeUser = useMutation({
    mutationFn: api.users.edit_user,
  });

  const handleOk = useCallback(async () => {
    setConfirmLoading(true);
    try {
      await revokeUser.mutateAsync({
        account_enabled: false,
        id: initialValues.id,
      });

      toast.success(
        "User successfully revoked. Please wait a moment or refresh the page for updates",
      );
      setIsRevokeModalOpen(false);
    } catch (err) {
      toast.error("Operation failed, please try again");
      setError(true);
    } finally {
      setConfirmLoading(false);
    }
  }, [revokeUser, setIsRevokeModalOpen, initialValues.id]);

  return (
    <Modal
      centered={true}
      confirmLoading={confirmLoading}
      okButtonProps={{ className: "rounded-none bg-primary" }}
      open={isRevokeModalOpen}
      title="Confirm user access modification"
      width={modalWidth}
      onCancel={() => {
        setIsRevokeModalOpen(false);
      }}
      onOk={handleOk}
    >
      <div>
        <p>
          This will revoke acces of the user with email{" "}
          <b>{initialValues.mail}</b> to the whole Giga platform, meaning they
          won't be able to access any part of the Giga platform
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
