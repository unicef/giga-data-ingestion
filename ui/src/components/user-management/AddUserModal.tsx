import { useState } from "react";

import { Button, Form, Input, Modal, Select } from "antd";

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
  const [form] = Form.useForm();

  const inputEmail = Form.useWatch("email", form);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
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
        type="primary"
        ghost
        className="ml-auto bg-primary"
        onClick={showModal}
      >
        Add User
      </Button>
      <Modal
        centered={true}
        title="Basic Modal"
        okText="Confirm"
        cancelText="Cancel"
        open={isModalOpen}
        onOk={() => {
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
        }}
        onCancel={handleCancel}
        width={"60%"}
        okButtonProps={{ className: "bg-primary" }}
      >
        <div className="ant-modal-header">Extra</div>

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
            <Select mode="multiple" options={[]} />
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
        okButtonProps={{ className: "bg-primary" }}
        okText="Confirm"
        open={isConfirmationModalOpen}
        onOk={() => {
          // rest of success logic here
          form.resetFields();
          setIsConfirmationModalOpen(false);
        }}
        onCancel={() => {
          console.log("Donners");
          setIsConfirmationModalOpen(false);
          setIsModalOpen(true);
        }}
      >
        <p>
          This will give the user with email <strong>{inputEmail}</strong>{" "}
          access toasfdasdfsdfasdfaccess toasfdasdfsdfasdfaccess
          toasfdasdfsdfasdfaccess toasfdasdfsdfasdfaccess
          toasfdasdfsdfasdfaccess toasfdasdfsdfasdfaccess
          toasfdasdfsdfasdfaccess toasfdasdfsdfasdf
        </p>
        <p>&nbsp;</p>
        <p>Is this correct?</p>
      </Modal>
    </>
  );
}
