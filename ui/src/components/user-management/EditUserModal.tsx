import { useEffect, useState } from "react";

import { PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { GraphUser } from "@/types/user";
import { filterCountries, filterRoles } from "@/utils/group";
import { matchNamesWithIds } from "@/utils/group";

interface EditUserModalProps {
  initialValues: GraphUser;
  isEditModalOpen: boolean;
  setIsEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

type CountryDataset = {
  country: string;
  dataset: string[];
};

interface Dataset {
  name: string;
  id: string;
}

const getInitialCountryDataset = (
  initialCountries: string[],
): CountryDataset[] => {
  return initialCountries
    .map(item => {
      const [country, dataset] = item.split("-");
      return { country, dataset };
    })
    .reduce((acc: CountryDataset[], { country, dataset }) => {
      const existingCountry = acc.find(item => item.country === country);
      if (existingCountry) {
        existingCountry.dataset.push(dataset);
      } else {
        acc.push({ country, dataset: [dataset] });
      }
      return acc;
    }, []);
};

export default function EditUserModal({
  initialValues,
  isEditModalOpen,
  setIsEditModalOpen,
}: EditUserModalProps) {
  const api = useApi();
  const user = initialValues.display_name;
  const initialEmail = initialValues.mail;
  const initialGroups = initialValues.member_of.map(
    group => group.display_name,
  );

  const initialCountries = filterCountries(initialGroups);
  const initialRoles = filterRoles(initialGroups);
  const initialCountryDataset = getInitialCountryDataset(initialCountries);
  const [form] = Form.useForm();

  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [swapModal, setSwapModal] = useState<boolean>(false);
  const [submittable, setSubmittable] = useState(false);

  const { data: groupsData } = useQuery({
    queryKey: ["groups"],
    queryFn: api.groups.list,
  });

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

  const modifyUserAccess = useMutation({
    mutationFn: api.groups.modify_user_access,
  });

  const groups =
    groupsData?.data.map(group => {
      return { id: group.id, name: group.display_name };
    }) ?? [];
  const roles = filterRoles(groups.map(group => group.name));

  const countryOptions = countries.map(country => ({
    value: country.name,
    label: country.name,
  }));

  const roleOptions = roles.map(role => ({
    value: role,
    label: role,
  }));

  const onOk = () => {
    form.submit();
  };

  const dataSetOptions = [
    "School Coverage",
    "School Geolocation",
    "School QoS",
  ].map(dataset => ({
    value: dataset,
    label: dataset,
  }));

  const handleModalCancel = (modalName: string) => {
    if (modalName == "EditModal") setIsEditModalOpen(false);
    setSwapModal(false);
  };

  return (
    <Form.Provider
      onFormFinish={async (name, { values, forms }) => {
        if (name === "editForm") {
          const countryDatasetValues: CountryDataset[] = values.countryDataset;
          const roleValues: string[] = values.role;
          const emailValue: string = values.email;

          const addedDatasets = countryDatasetValues
            .map(({ country, dataset }) => {
              const initialCountry = initialCountryDataset.find(
                el => el.country === country,
              );
              return {
                country,
                dataset: dataset.filter(
                  el => !initialCountry?.dataset.includes(el),
                ),
              };
            })
            .filter(({ dataset }) => dataset.length > 0)
            .flatMap(({ country, dataset }) =>
              dataset.map(ds => `${country}-${ds}`),
            );

          const removedDatasets = initialCountryDataset
            .map(({ country, dataset }) => {
              const finalCountry = countryDatasetValues.find(
                el => el.country === country,
              );
              return {
                country,
                dataset: dataset.filter(
                  el => !finalCountry?.dataset.includes(el),
                ),
              };
            })
            .filter(({ dataset }) => dataset.length > 0)
            .flatMap(({ country, dataset }) =>
              dataset.map(ds => `${country}-${ds}`),
            );

          const addedRoles = roleValues.filter(
            element => !initialRoles.includes(element),
          );
          const removedRoles = initialRoles.filter(
            element => !roleValues.includes(element),
          );

          const addedDatasetsWithIds = matchNamesWithIds(addedDatasets, groups);
          const removedDatasetsWithIds = matchNamesWithIds(
            removedDatasets,
            groups,
          );

          const addedRolesWithIds = matchNamesWithIds(addedRoles, groups);
          const removedRolesWithIds = matchNamesWithIds(removedRoles, groups);

          const { confirmForm } = forms;

          confirmForm.setFieldValue("email", emailValue);
          confirmForm.setFieldValue("addedRoles", addedRolesWithIds);
          confirmForm.setFieldValue("removedRoles", removedRolesWithIds);
          confirmForm.setFieldValue("addedDatasets", addedDatasetsWithIds);
          confirmForm.setFieldValue("removedDatasets", removedDatasetsWithIds);
        }

        if (name === "confirmForm") {
          const addGroupsPayload = {
            email: values.email,
            groups_to_add: [...values.addedDatasets, ...values.addedRoles].map(
              dataset => dataset.id,
            ),
            groups_to_remove: [
              ...values.removedDatasets,
              ...values.removedRoles,
            ].map(dataset => dataset.id),
            user_id: initialValues.id,
          };
          setConfirmLoading(true);

          try {
            await modifyUserAccess.mutateAsync(addGroupsPayload);
            setSwapModal(false);
            setIsEditModalOpen(false);
            setConfirmLoading(false);
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
        open={isEditModalOpen && !swapModal}
        title="Modify User Access"
        width={"75%"}
        onCancel={() => handleModalCancel("EditModal")}
        onOk={() => {
          form.submit();
          setSwapModal(true);
        }}
      >
        <Form
          form={form}
          initialValues={{
            user: user ?? "",
            email: initialEmail ?? "",
            role: initialRoles,
            countryDataset: initialCountryDataset,
          }}
          labelCol={{ span: 4 }}
          name="editForm"
          wrapperCol={{ span: 16 }}
        >
          <Form.Item label="User" name="user" rules={[{ required: true }]}>
            <Input disabled />
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
        open={isEditModalOpen && swapModal}
        title="Confirm user acess modification"
        onCancel={() => handleModalCancel("ConfirmModal")}
        onOk={onOk}
      >
        <Form name="confirmForm">
          <Form.Item
            shouldUpdate={(prevValues, curValues) =>
              prevValues.email !== curValues.email
            }
          >
            {({ getFieldValue }) => {
              const email = getFieldValue("email") || [];
              const emailDisplay = email.length === 0 ? initialEmail : email;
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
                  <b>{emailDisplay}</b>
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
          <Form.Item name="removedRoles" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="addedDatasets" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="removedDatasets" hidden>
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
    </Form.Provider>
  );
}
