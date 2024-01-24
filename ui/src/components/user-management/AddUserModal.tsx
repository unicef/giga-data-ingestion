import { Dispatch, SetStateAction, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Add } from "@carbon/icons-react";
import { Button, Modal } from "@carbon/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, Col, Divider, Form, Input, Row, Select } from "antd";

import { useApi } from "@/api";
import countries from "@/constants/countries";
import { filterRoles, matchNamesWithIds } from "@/utils/group";
import {
  getUniqueDatasets,
  pluralizeCountries,
  pluralizeDatasets,
} from "@/utils/string";

type CountryDataset = {
  country: string;
  dataset: string[];
};

interface AddUserModalProps {
  isAddModalOpen: boolean;
  setIsAddModalOpen: Dispatch<SetStateAction<boolean>>;
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

  const inviteAndAddGroups = useMutation({
    mutationFn: api.users.invite_and_add_groups,
  });

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
        const givenName: string = values.givenName;
        const surname: string = values.surname;
        const countryDatasetValues: CountryDataset[] =
          values.countryDataset ?? [];
        const roles: string[] = values.role;
        const email: string = values.email;

        if (name === "addForm") {
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
          const addedRolesWithIds = matchNamesWithIds(roles, groups);

          const { confirmForm } = forms;

          confirmForm.setFieldValue("givenName", givenName);
          confirmForm.setFieldValue("surname", surname);
          confirmForm.setFieldValue("email", email);
          confirmForm.setFieldValue("addedRoles", addedRolesWithIds);
          confirmForm.setFieldValue("addedDatasets", addedDatasetsWithIds);
        }

        if (name === "confirmForm") {
          const addGroupsPayload = {
            groups_to_add: [...values.addedDatasets, ...values.addedRoles].map(
              dataset => dataset.id,
            ),
            invited_user_display_name: values.givenName + " " + values.surname,
            invited_user_email_address: values.email,
          };

          try {
            setConfirmLoading(true);

            await inviteAndAddGroups.mutateAsync(addGroupsPayload);
            toast.success(
              "User successfully added. Please wait a moment or refresh the page for updates",
            );
            form.resetFields();
            setSwapModal(false);
            setIsAddModalOpen(false);
          } catch (err) {
            toast.error("Operation failed. Please try again");
            setError(true);
            setConfirmLoading(false);
          }
        }
      }}
    >
      <Modal
        primaryButtonText="Confirm"
        secondaryButtonText="Cancel"
        primaryButtonDisabled={!submittable}
        open={isAddModalOpen && !swapModal}
        modalHeading="Add New User"
        onRequestClose={() => handleModalCancel("AddModal")}
        onRequestSubmit={() => {
          form.submit();
          setSwapModal(true);
        }}
      >
        <Form
          form={form}
          labelCol={{ span: 4 }}
          name="addForm"
          wrapperCol={{ span: 16 }}
        >
          <Form.Item
            label="First Name"
            name="givenName"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Last Name"
            name="surname"
            rules={[{ required: true }]}
          >
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
                        kind="ghost"
                        size="sm"
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
                        kind="ghost"
                        renderIcon={Add}
                        onClick={() => add()}
                        size="sm"
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
        open={isAddModalOpen && swapModal}
        modalHeading="Confirm new User"
        onAbort={() => handleModalCancel("ConfirmModal")}
        onSubmit={() => form.submit()}
      >
        <Form name="confirmForm">
          <Form.Item
            shouldUpdate={(prevValues, curValues) =>
              prevValues.email !== curValues.email
            }
          >
            {({ getFieldValue }) => {
              const { countries, email, uniqueDatasets } =
                getUniqueDatasets(getFieldValue);

              return (
                <div>
                  {`This will give the user with email `}
                  <b>{email}</b>
                  {` access to Giga data for `}
                  <b>{pluralizeDatasets(uniqueDatasets)}</b>
                  {` across ${countries.length} ${
                    countries.length === 1 ? "country" : "countries"
                  } `}
                  <b>{pluralizeCountries(countries)}</b>
                  .
                  <br />
                  <br />
                </div>
              );
            }}
          </Form.Item>
          <Form.Item name="givenName" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="surname" hidden>
            <Input />
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
                className="rounded-none bg-primary text-white"
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
        kind="tertiary"
        renderIcon={Add}
        onClick={() => setIsAddModalOpen(true)}
      >
        Add User
      </Button>
    </Form.Provider>
  );
}
