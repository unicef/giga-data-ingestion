import { useState } from "react";

import { useMutation } from "@tanstack/react-query";
import { Alert, Modal } from "antd";

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

  const [confirmLoading, setConfirmLoading] = useState(false);
  const [error, setError] = useState(false);
  const revokeUser = useMutation({
    mutationFn: api.users.edit_user,
  });

  return (
    <Modal
      centered={true}
      confirmLoading={confirmLoading}
      okButtonProps={{ className: "rounded-none bg-primary" }}
      open={isRevokeModalOpen}
      title="Confirm user acess modification"
      width="60%"
      onCancel={() => {
        setIsRevokeModalOpen(false);
      }}
      onOk={async () => {
        setConfirmLoading(true);
        try {
          await revokeUser.mutateAsync({
            account_enabled: false,
            id: initialValues.id,
          });
          setConfirmLoading(false);
          setIsRevokeModalOpen(false);
        } catch (err) {
          setError(true);
          setConfirmLoading(false);
        }
      }}
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
