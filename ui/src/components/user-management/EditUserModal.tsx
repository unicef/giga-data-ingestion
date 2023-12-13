import { useState } from "react";

import { CloseCircleOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Form, Input, Modal, Select } from "antd";

import { useApi } from "@/api";
import { countries as COUNTRIES } from "@/constants/countries";
import { GraphUser } from "@/types/user";
import { filterCountries, filterRoles } from "@/utils/countries";
import { formatCountries } from "@/utils/string";

interface EditUserModalProps {
  initialValues: GraphUser | undefined;
  isEditModalOpen: boolean;
  setIsEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

type FieldType = {
  email: string;
  user: string;
  country: string[];
  role: string[];
};

const defaultGraphUser: GraphUser = {
  id: "",
  account_enabled: false,
  display_name: "",
  mail: "",
  member_of: [],
  user_principal_name: "",
  external_user_state: null,
};

export default function EditUserModal({
  initialValues = defaultGraphUser,
  isEditModalOpen,
  setIsEditModalOpen,
}: EditUserModalProps) {
  const user = initialValues.display_name;
  const email = initialValues.mail;
  const initialCountries = filterCountries(
    initialValues.member_of.map(group => group.display_name),
  );
  const initialRoles = filterRoles(
    initialValues.member_of.map(group => group.display_name),
  );

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  // const [selectedCountries, setSelectedCountries] = useState<string[]>();
  // const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const api = useApi();

  const { isLoading: groupsIsLoading, data: groupsData } = useQuery({
    queryKey: ["groups"],
    queryFn: api.groups.list,
  });

  const inputEmail = Form.useWatch("email", form);
  const inputUser = Form.useWatch("user", form);
  const inputCountries = Form.useWatch("country", form);
  const inputRole = Form.useWatch("role", form);

  const groups = groupsData?.data?.map(group => group.display_name) ?? [];

  const countries = filterCountries(groups);
  const roles = filterRoles(groups);

  const roleOptions = roles.map(role => ({
    value: role,
    label: role,
  }));

  const countryOptions = countries.map(country => ({
    value: country,
    label: country,
  }));

  const anarray = [inputCountries];
  const formattedCountries = formatCountries(anarray);

  const handleCancelConfirm = () => {
    setIsConfirmationModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleOkConfirm = () => {
    form.resetFields();
    setIsConfirmationModalOpen(false);
  };

  const handleChange = (value: string[]) => {
    console.log(value);
  };

  const onFinish = values => {
    console.log("Success:", values);

    form
      .validateFields()
      .then(values => {
        console.log("recieved values of form: ", values);
        setIsEditModalOpen(false);
        setIsConfirmationModalOpen(true);
      })
      .catch(info => {
        console.log("Validation failed:", info);
      });
  };

  const handleCancelForm = () => {
    form.resetFields();
    setIsEditModalOpen(false);
  };

  const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
    style: { maxWidth: 600 },
  };

  return (
    <>
      {groupsIsLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <Modal
            centered={true}
            title="Modify User"
            okText="Confirm"
            cancelText="Cancel"
            okButtonProps={{ className: "rounded-none bg-primary" }}
            cancelButtonProps={{ className: "rounded-none" }}
            open={isEditModalOpen}
            onOk={form.submit}
            onCancel={handleCancelForm}
            width={"60%"}
          >
            <Form
              {...layout}
              form={form}
              name="add user"
              initialValues={{
                user: user,
                email: email,
                country: initialCountries,
                role: initialRoles,
              }}
              onFinish={onFinish}
              autoComplete="off"
              style={{ padding: 0 }}
            >
              <Form.Item<FieldType> label="User" name="user">
                <Input disabled />
              </Form.Item>
              <Form.Item<FieldType> label="Email" name="email">
                <Input disabled />
              </Form.Item>

              <Form.Item<FieldType>
                label="Country"
                name="country"
                rules={[{ required: true, message: "Please input a country" }]}
              >
                <Select
                  allowClear
                  mode="multiple"
                  placeholder="Select relevant countries"
                  // onChange={handleChange}
                  options={countryOptions}
                />
              </Form.Item>

              <Form.Item<FieldType>
                label="Role"
                name="role"
                rules={[{ required: true, message: "Please input a role" }]}
              >
                <Select
                  allowClear
                  mode="multiple"
                  style={{ width: "100%" }}
                  options={roleOptions}
                />
              </Form.Item>
            </Form>
          </Modal>
          <Modal
            centered={true}
            classNames={{ header: "border-b pb-1" }}
            closeIcon={<CloseCircleOutlined />}
            // confirmLoading={confirmLoading}
            cancelButtonProps={{ className: "rounded-none" }}
            okButtonProps={{ className: "rounded-none bg-primary" }}
            okText="Confirm"
            open={isConfirmationModalOpen}
            onOk={handleOkConfirm}
            onCancel={handleCancelConfirm}
            title="Add new user"
          >
            <p>
              {/* This will give the user with email <strong>{inputEmail}</strong>{" "} */}
              {/* access to <strong>{inputCountries.length}</strong>{" "} */}
              {/* {inputCountries.length > 1 ? "countries, " : "country, "} */}
              <strong>{formattedCountries}</strong> as{" "}
              {/* <strong>{inputRole}</strong> */}
            </p>
            <p>&nbsp;</p>
            <p>Is this correct?</p>
            {/* <button onClick={() => console.log(inputCountries)}>
          Display countries
        </button> */}
          </Modal>
        </>
      )}
    </>
  );
}
