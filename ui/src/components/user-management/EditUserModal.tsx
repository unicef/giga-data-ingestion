import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { CloseCircleOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { Input, Modal, Select } from "antd";

import { useApi } from "@/api";
import { GraphUser } from "@/types/user";
import { filterCountries, filterRoles } from "@/utils/countries";

interface EditUserModalProps {
  initialValues: GraphUser;
  isEditModalOpen: boolean;
  setIsEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface IFormInputs {
  user: string;
  email: string;
  countries: string[];
  roles: string[];
}

export default function EditUserModal({
  initialValues,
  isEditModalOpen,
  setIsEditModalOpen,
}: EditUserModalProps) {
  const api = useApi();
  const user = initialValues.display_name;
  const email = initialValues.mail;
  const initialGroups = initialValues.member_of.map(
    group => group.display_name,
  );

  const initialCountries = filterCountries(initialGroups);
  const initialRoles = filterRoles(initialGroups);

  const [swapModal, setSwapModal] = useState<boolean>(false);
  const [selectedCountries, setSelectedCountries] = useState(initialCountries);
  const [selectedRoles, setSelectedRoles] = useState(initialRoles);

  const { data: groupsData } = useQuery({
    queryKey: ["groups"],
    queryFn: api.groups.list,
  });

  const addUserToGroup = useMutation({
    mutationFn: api.groups.add_user_to_group,
  });

  const removeUserFromGroup = useMutation({
    mutationFn: api.groups.remove_user_from_group,
  });

  const groups = groupsData?.data?.map(group => group.display_name) ?? [];
  const countries = filterCountries(groups);
  const roles = filterRoles(groups);

  const countryOptions = countries.map(country => ({
    value: country,
    label: country,
  }));
  const roleOptions = roles.map(role => ({
    value: role,
    label: role,
  }));

  const { handleSubmit, control } = useForm<IFormInputs>({
    defaultValues: {
      user: user ?? "",
      email: email ?? "",
      countries: initialCountries,
      roles: initialRoles,
    },
  });

  const countriesToAdd = selectedCountries.filter(
    (country: string) => !initialCountries.includes(country),
  );
  const countriesToRemove = initialCountries.filter(
    (country: string) => !selectedCountries.includes(country),
  );
  const rolesToAdd = selectedRoles.filter(
    (role: string) => !initialRoles.includes(role),
  );
  const rolesToRemove = initialRoles.filter(
    (role: string) => !selectedRoles.includes(role),
  );

  const onSubmit = async (data: IFormInputs) => {
    const { countries, roles } = data;

    setSwapModal(true);
    setSelectedCountries(countries);
    setSelectedRoles(roles);
  };

  const handleCancelForm = () => setIsEditModalOpen(false);

  const handleConfirm = async () => {
    const countryGroupIdsToAdd = groupsData?.data
      .filter(group => countriesToAdd.includes(group.display_name))
      .map(group => group.id);

    const countryGroupIdsToRemove = groupsData?.data
      .filter(group => countriesToRemove.includes(group.display_name))
      .map(group => group.id);

    const roleGroupIdsToAdd = groupsData?.data
      .filter(group => rolesToAdd.includes(group.display_name))
      .map(group => group.id);

    const roleGroupIdsToRemove = groupsData?.data
      .filter(group => rolesToRemove.includes(group.display_name))
      .map(group => group.id);

    const groupIdsToAdd = [
      ...(countryGroupIdsToAdd ?? []),
      ...(roleGroupIdsToAdd ?? []),
    ];
    const groupIdsToRemove = [
      ...(countryGroupIdsToRemove ?? []),
      ...(roleGroupIdsToRemove ?? []),
    ];

    groupIdsToAdd?.map(groupId =>
      addUserToGroup.mutate({
        user_id: initialValues.id,
        id: groupId,
      }),
    );
    groupIdsToRemove?.map(groupId =>
      removeUserFromGroup.mutate({
        user_id: initialValues.id,
        group_id: groupId,
      }),
    );

    setSwapModal(false);
    setIsEditModalOpen(false);
  };

  return (
    <>
      <div>
        <Modal
          centered={true}
          title="Modify User"
          okText="Confirm"
          cancelText="Cancel"
          okButtonProps={{
            disabled:
              countriesToAdd.length === 0 && countriesToRemove.length === 0,
            className: "rounded-none bg-primary",
          }}
          cancelButtonProps={{ className: "rounded-none" }}
          open={isEditModalOpen && !swapModal}
          onOk={handleSubmit(onSubmit)}
          onCancel={handleCancelForm}
          width={"40%"}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <Controller
              disabled
              name="user"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
            <Controller
              disabled
              name="email"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
            <Controller
              name="countries"
              control={control}
              render={({ field }) => (
                <Select
                  mode="multiple"
                  onSelect={value =>
                    setSelectedCountries(prev => [...prev, value])
                  }
                  onDeselect={value => {
                    setSelectedCountries(prev =>
                      prev.filter(country => country !== value),
                    );
                  }}
                  options={countryOptions}
                  {...field}
                />
              )}
            />
            <Controller
              name="roles"
              control={control}
              render={({ field }) => (
                <Select
                  mode="multiple"
                  onSelect={value => setSelectedRoles(prev => [...prev, value])}
                  onDeselect={value =>
                    setSelectedRoles(prev =>
                      prev.filter(role => role !== value),
                    )
                  }
                  options={roleOptions}
                  {...field}
                />
              )}
            />
          </form>
        </Modal>
        <Modal
          centered={true}
          classNames={{ header: "border-b pb-1" }}
          closeIcon={<CloseCircleOutlined />}
          confirmLoading={addUserToGroup.isPending}
          cancelButtonProps={{ className: "rounded-none" }}
          okButtonProps={{ className: "rounded-none bg-primary" }}
          okText="Confirm"
          open={swapModal}
          onOk={handleConfirm}
          onCancel={() => setSwapModal(false)}
          title="Add new user"
        >
          <p>&nbsp;</p>
          <p>Is this correct?</p>
        </Modal>
      </div>
    </>
  );
}
