import { useState } from "react";
import { useForm } from "react-hook-form";

import { CloseCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { Button, Form, Input, Modal, Select } from "antd";

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

  const [form] = Form.useForm();
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

  // TODO make fetching more aggressive?
  // optimistic updates
  return (
    <>
      <Modal
        centered={true}
        title="Modify User Access"
        okText="Confirm"
        cancelText="Cancel"
        okButtonProps={{
          // disabled:
          //   countriesToAdd.length === 0 && countriesToRemove.length === 0,
          className: "rounded-none bg-primary",
        }}
        cancelButtonProps={{ className: "rounded-none" }}
        open={isEditModalOpen && !swapModal}
        // onOk={handleSubmit(onSubmit)}
        onOk={values => console.log(values)}
        onCancel={handleCancelForm}
        width={"75%"}
      >
        {/* <form onSubmit={handleSubmit(onSubmit)}>
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
                  setSelectedRoles(prev => prev.filter(role => role !== value))
                }
                options={roleOptions}
                {...field}
              />
            )}
          />
        </form> */}
        <>
          <Form
            form={form}
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 16 }}
            name="editUserForm"
            initialValues={{
              user: user ?? "",
              email: email ?? "",
              countries: initialCountries,
              roles: initialRoles,
            }}
          >
            <Form.Item name="user" label="User" rules={[{ required: true }]}>
              <Input disabled />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item
              name="countries"
              label="Countries"
              rules={[{ required: true }]}
            >
              <Select
                mode="multiple"
                options={countryOptions}
                placeholder="What level of access does this user have for Giga?"
              ></Select>
            </Form.Item>
            <Form.List name="countryDataset">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }, index) => (
                    <div key={key}>
                      <Form.Item
                        // {...restField}
                        label={index ? `Country ${index}` : `Country`}
                        name={[name, "first"]}
                        rules={[
                          { required: true, message: "Missing first name" },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input placeholder="First Name" />
                      </Form.Item>
                      <Form.Item
                        style={{ marginBottom: 0 }}
                        wrapperCol={{ span: 16, offset: 4 }}
                      >
                        <Button
                          className="p-0"
                          type="link"
                          onClick={() => remove(name)}
                        >
                          <span className="m-0 underline">Remove pair</span>
                        </Button>
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        label="Dataset"
                        name={[name, "last"]}
                        rules={[
                          { required: true, message: "Missing last name" },
                        ]}
                      >
                        <Input placeholder="Last Name" />
                      </Form.Item>
                    </div>
                  ))}
                  <Form.Item>
                    <Button
                      className="ml-auto rounded-none border-none bg-primary"
                      ghost
                      icon={<PlusOutlined />}
                      onClick={() => add()}
                      type="primary"
                    >
                      Add Country
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form>
        </>
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
        // onOk={handleConfirm}
        onOk={values => console.log("Received values of form:", values)}
        onCancel={() => setSwapModal(false)}
        title="Add new user"
      >
        form
        <p>Is this correct?</p>
      </Modal>
    </>
  );
}
