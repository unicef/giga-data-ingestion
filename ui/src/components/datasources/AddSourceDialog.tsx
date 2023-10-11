import { useState } from "react";

import { Button, Form, Input, Modal, Select, Space } from "antd";

interface Props {
  selectedDataSource: string;
  open: boolean;
  onClose: () => void;
}

export default function AddSourceDialog({
  selectedDataSource,
  onClose,
  open,
}: Props) {
  const [authMethod, setAuthMethod] = useState(null);
  const [endpoint, setEndpoint] = useState("");
  const [endpointTest, setEndpointTest] = useState({});

  async function handleTest() {
    const res = await fetch(endpoint);
    setEndpointTest(await res.json());
  }

  function handleClose() {
    setAuthMethod(null);
    setEndpoint("");
    setEndpointTest({});
    onClose();
  }

  return (
    <Modal
      title={`Add data source > ${selectedDataSource}`}
      open={open}
      okButtonProps={{ className: "hidden" }}
      cancelButtonProps={{ className: "hidden" }}
      onOk={handleClose}
      onCancel={handleClose}
      width="75vw"
      destroyOnClose
    >
      <Form
        onFinish={handleClose}
        layout="vertical"
        className="grid grid-cols-2 gap-8"
      >
        <div>
          <Form.Item<string>
            label="API Endpoint"
            name="endpoint"
            rules={[{ required: true, message: "Required field" }]}
          >
            <Space.Compact className="w-full">
              <Input onChange={({ target: { value } }) => setEndpoint(value)} />
              <Button
                type="primary"
                className="bg-primary"
                onClick={handleTest}
              >
                Test
              </Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item<string> label="Authentication Method" name="authMethod">
            <Select
              value={authMethod}
              onChange={value => setAuthMethod(value)}
              options={[
                {
                  label: "None",
                  value: null,
                },
                {
                  label: "Bearer Token",
                  value: "bearerToken",
                },
                {
                  label: "API Key/Secret",
                  value: "apiKey",
                },
              ]}
            />
          </Form.Item>

          {authMethod === "bearerToken" && (
            <Form.Item<string> label="Bearer Token" name={authMethod}>
              <Input />
            </Form.Item>
          )}

          <Form.Item<string> label="Data Key" name="dataKey">
            <Input />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="bg-primary">
              Save
            </Button>
          </Form.Item>
        </div>
        <div className="h-[65vh] overflow-auto rounded bg-slate-800 p-4 text-gray-4">
          <code>
            <pre>{JSON.stringify(endpointTest, null, 2)}</pre>
          </code>
        </div>
      </Form>
    </Modal>
  );
}
