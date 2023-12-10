import { useState } from "react";

import { CloseCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Select } from "antd";

import countries from "@/constants/countries";
import { formatCountries } from "@/utils/string";

type FieldType = {
  email?: string;
  country?: string[];
  role?: string;
};

const onFinish = (values: any) => {
  console.log("Success:", values);
};

const onFinishFailed = (errorInfo: any) => {
  console.log("Failed:", errorInfo);
};

export default function AddUserModal() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const inputEmail = Form.useWatch("email", form);

  const countryOptions = countries.map(country => ({
    value: country.name,
    label: country.name,
  }));

  const formattedCountries = formatCountries(selectedCountries);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancelConfirm = () => {
    setIsConfirmationModalOpen(false);
    setIsModalOpen(true);
  };

  const handleOkConfirm = () => {
    form.resetFields();
    setIsConfirmationModalOpen(false);
  };

  const handleChange = (value: string[]) => {
    setSelectedCountries(value);
  };

  // new handles
  const handleOkForm = () => {
    form
      .validateFields()
      .then(values => {
        console.log("recieved values of form: ", values);
        setIsModalOpen(false);
        setIsConfirmationModalOpen(true);
      })
      .catch(info => {
        console.log("Validation failed:", info);
      });
  };

  const handleCancelForm = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
    style: { maxWidth: 600 },
  };

  return (
    <>
      <Button
        className="ml-auto rounded-none bg-primary"
        ghost
        icon={<PlusOutlined />}
        onClick={showModal}
        type="primary"
      >
        Add User
      </Button>
      <Modal
        centered={true}
        title="Add new user"
        okText="Confirm"
        cancelText="Cancel"
        okButtonProps={{ className: "rounded-none bg-primary" }}
        cancelButtonProps={{ className: "rounded-none" }}
        open={isModalOpen}
        onOk={handleOkForm}
        onCancel={handleCancelForm}
        width={"60%"}
      >
        <Form
          {...layout}
          form={form}
          name="add user"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          style={{ padding: 0 }}
        >
          <Form.Item<FieldType>
            label="Email"
            name="email"
            rules={[{ required: true, message: "Please input an email" }]}
          >
            <Input />
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
              onChange={handleChange}
              options={countryOptions}
            />
          </Form.Item>

          <Form.Item<FieldType>
            label="Role"
            name="role"
            rules={[{ required: true, message: "Please input a role" }]}
          >
            <Select
              style={{ width: "100%" }}
              options={[
                { value: "jack", label: "Jack" },
                { value: "lucy", label: "Lucy" },
                { value: "Yiminghe", label: "yiminghe" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        centered={true}
        classNames={{ header: "border-b pb-1" }}
        closeIcon={<CloseCircleOutlined />}
        confirmLoading={confirmLoading}
        cancelButtonProps={{ className: "rounded-none" }}
        okButtonProps={{ className: "rounded-none bg-primary" }}
        okText="Confirm"
        open={isConfirmationModalOpen}
        onOk={handleOkConfirm}
        onCancel={handleCancelConfirm}
        title="Add new user"
      >
        <p>
          This will give the user with email <strong>{inputEmail}</strong>{" "}
          access to <strong>{selectedCountries.length}</strong>{" "}
          {selectedCountries.length > 1 ? "countries, " : "country, "}
          <strong>{formattedCountries}</strong>
        </p>
        <p>&nbsp;</p>
        <p>Is this correct?</p>
      </Modal>
    </>
  );
}
