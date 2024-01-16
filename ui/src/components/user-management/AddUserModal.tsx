import { useEffect, useState } from "react";

import { PlusOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
} from "antd";

import { useApi } from "@/api";
import countries from "@/constants/countries";
import { filterRoles } from "@/utils/group";
import { matchNamesWithIds } from "@/utils/group";

type CountryDataset = {
  country: string;
  dataset: string[];
};

interface AddUserModalProps {
  isAddModalOpen: boolean;
  setIsAddModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface Dataset {
  name: string;
  id: string;
}

export default function AddUserModal({
  isAddModalOpen,
  setIsAddModalOpen,
}: AddUserModalProps) {
  const api = useApi();

  const [form] = Form.useForm();

  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [swapModal, setSwapModal] = useState<boolean>(false);
  const [submittable, setSubmittable] = useState(false);

  const values = Form.useWatch([], form);
  useEffect(() => {
    form.validateFields({ validateOnly: true }).then(
      () => {
        setSubmittable(true);
      },
      () => {
        setSubmittable(false);
      },
    );
  }, [form, values]);
  const countryOptions = countries.map(country => ({
    value: country.name,
    label: country.name,
  }));

  const { data: groupsData } = useQuery({
    queryKey: ["groups"],
    queryFn: api.groups.list,
  });

  const groups =
    groupsData?.data.map(group => {
      return { id: group.id, name: group.display_name };
    }) ?? [];
  const roles = filterRoles(groups.map(group => group.name));

  const roleOptions = roles.map(role => ({
    value: role,
    label: role,
  }));

  const dataSetOptions = [
    "School Coverage",
    "School Geolocation",
    "School QoS",
  ].map(dataset => ({
    value: dataset,
    label: dataset,
  }));

  const handleModalCancel = (modalName: string) => {
    if (modalName == "AddModal") setIsAddModalOpen(false);
    setSwapModal(false);
  };

  return (
    <Form.Provider
      onFormFinish={async (name, { values, forms }) => {
        console.log(forms);
        if (name === "addForm") {
          const countryDatasetValues: CountryDataset[] =
            values.countryDataset ?? [];
          const roleValues: string[] = values.role;
          const emailValue: string = values.email;

          const addedDatasets = countryDatasetValues
            .map(({ country, dataset }) => {
              return {
                country,
                dataset: dataset,
              };
            })
            .filter(({ dataset }) => dataset.length > 0)
            .flatMap(({ country, dataset }) =>
              dataset.map(ds => `${country}-${ds}`),
            );

          const addedDatasetsWithIds = matchNamesWithIds(addedDatasets, groups);
          const addedRolesWithIds = matchNamesWithIds(roleValues, groups);

          const { confirmForm } = forms;

          confirmForm.setFieldValue("email", emailValue);
          confirmForm.setFieldValue("addedRoles", addedRolesWithIds);
          confirmForm.setFieldValue("addedDatasets", addedDatasetsWithIds);
        }

        if (name === "confirmForm") {
          console.log(values);

          try {
            // await modifyUserAccess.mutateAsync(addGroupsPayload);
            setSwapModal(false);
            setIsAddModalOpen(false);
          } catch (err) {
            setError(true);
            setConfirmLoading(false);
          }
        }
      }}
    >
      <Modal
        cancelButtonProps={{ className: "rounded-none" }}
        cancelText="Cancel"
        centered={true}
        okButtonProps={{
          disabled: !submittable,
          className: "rounded-none bg-primary",
        }}
        okText="Confirm"
        open={isAddModalOpen && !swapModal}
        title="Add New User"
        width={"75%"}
        onCancel={() => handleModalCancel("AddModal")}
        onOk={() => {
          form.submit();
          setSwapModal(true);
        }}
      >
        <Form
          form={form}
          initialValues={{
            user: "adas",
          }}
          labelCol={{ span: 4 }}
          name="addForm"
          wrapperCol={{ span: 16 }}
        >
          <Form.Item label="User" name="user" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Role" name="role" rules={[{ required: true }]}>
            <Select
              mode="multiple"
              options={roleOptions}
              placeholder="What level of access does this user have for Giga?"
            ></Select>
          </Form.Item>
          <Form.List name="countryDataset">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <div key={key}>
                    {index !== 0 && (
                      <Row>
                        <Col span={4}></Col>
                        <Col span={16}>
                          <Divider dashed className="m-3" />
                        </Col>
                      </Row>
                    )}
                    <Form.Item
                      label={index ? `Country ${index}` : `Country`}
                      name={[name, "country"]}
                      rules={[{ message: "Missing Country", required: true }]}
                      style={{ marginBottom: 0 }}
                      {...restField}
                    >
                      <Select
                        options={countryOptions}
                        placeholder="Select Country"
                      />
                    </Form.Item>
                    <Form.Item
                      style={{ marginBottom: 0 }}
                      wrapperCol={{ offset: 4, span: 16 }}
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
                      label="Dataset"
                      name={[name, "dataset"]}
                      rules={[{ message: "Missing Dataset", required: true }]}
                      style={{ marginBottom: 0 }}
                      {...restField}
                    >
                      <Select
                        mode="multiple"
                        placeholder="Select Dataset for Country"
                        options={dataSetOptions} //
                      />
                    </Form.Item>
                  </div>
                ))}
                <Form.Item>
                  <Row>
                    <Col span={4}></Col>
                    <Col span={16}>
                      <Button
                        className="ml-auto mt-5 rounded-none border-none bg-primary"
                        ghost
                        icon={<PlusOutlined />}
                        type="primary"
                        onClick={() => add()}
                      >
                        Add Country
                      </Button>
                    </Col>
                  </Row>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
      <Modal
        centered={true}
        footer={null}
        open={isAddModalOpen && swapModal}
        title="Confirm new User"
        onCancel={() => handleModalCancel("ConfirmModal")}
        onOk={() => form.submit()}
      >
        <Form name="confirmForm">
          <Form.Item
            shouldUpdate={(prevValues, curValues) =>
              prevValues.email !== curValues.email
            }
          >
            {({ getFieldValue }) => {
              const email = getFieldValue("email") || [];
              const addedDatasets: Dataset[] =
                getFieldValue("addedDatasets") || [];

              const uniqueCountries = new Set<string>();
              const datasetTypes = new Set();

              addedDatasets.forEach(item => {
                const country = item.name.split("-")[0];
                uniqueCountries.add(country);

                if (item.name.includes("School Geolocation")) {
                  datasetTypes.add("School Geolocation");
                }
                if (item.name.includes("School Coverage")) {
                  datasetTypes.add("School Coverage");
                }
                if (item.name.includes("School QoS")) {
                  datasetTypes.add("School QoS");
                }
              });

              const result: { countries: string[]; uniqueDatasets: number } = {
                countries: Array.from(uniqueCountries),
                uniqueDatasets: datasetTypes.size,
              };

              return (
                <div>
                  {`This will give the user with email `}
                  <b>{email}</b>
                  {` access to Giga data for `}
                  <b>
                    {result.uniqueDatasets}{" "}
                    {result.uniqueDatasets === 1 ? "dataset" : "datasets"}
                  </b>
                  {` across ${result.countries.length} countries, `}
                  <b>
                    {result.countries.slice(0, -1).join(", ") +
                      (result.countries.length > 1 ? ", and " : "") +
                      result.countries.slice(-1)}
                  </b>
                  .
                  <br />
                  <br />
                </div>
              );
            }}
          </Form.Item>
          <Form.Item name="email" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="addedRoles" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="addedDatasets" hidden>
            <Input />
          </Form.Item>

          {error && (
            <Alert message="Operation failed, please try again" type="error" />
          )}
          <Form.Item className="mb-0 ">
            <div className="flex justify-end gap-2">
              <Button
                className="rounded-none "
                onClick={() => handleModalCancel("ConfirmModal")}
              >
                Cancel
              </Button>
              <Button
                className="rounded-none bg-primary"
                htmlType="submit"
                loading={confirmLoading}
              >
                Confirm
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
      <Button
        className="ml-auto rounded-none bg-primary"
        ghost
        icon={<PlusOutlined />}
        onClick={() => setIsAddModalOpen(true)}
        type="primary"
      >
        Add User
      </Button>
      <div>
        Swap Modal: {swapModal.toString()} <br />
        Is Add Modal Open: {isAddModalOpen.toString()}
      </div>
    </Form.Provider>
  );
}
