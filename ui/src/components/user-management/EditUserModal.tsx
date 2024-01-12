import { useState } from "react";

import { PlusOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Col, Divider, Form, Input, Modal, Row, Select } from "antd";

import { useApi } from "@/api";
import countries from "@/constants/countries";
import { GraphUser } from "@/types/user";

interface EditUserModalProps {
  initialValues: GraphUser;
  isEditModalOpen: boolean;
  setIsEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

function filterCountries(groups: string[]): string[] {
  return groups.filter(group => {
    return countries.some(country =>
      group.split("-")[0].startsWith(country.name),
    );
  });
}

function filterRoles(groups: string[]): string[] {
  return groups.filter(group => {
    return !countries.some(country =>
      group.split("-")[0].startsWith(country.name),
    );
  });
}

type CountryDataset = {
  country: string;
  dataset: string[];
};

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

const matchNamesWithIds = (
  names: string[],
  data: { id: string; name: string }[],
): { name: string; id: string | undefined }[] => {
  return names.map(name => {
    const matchingData = data.find(d => d.name === name);
    return { name, id: matchingData?.id };
  });
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

  const [swapModal, setSwapModal] = useState<boolean>(false);

  const { data: groupsData } = useQuery({
    queryKey: ["groups"],
    queryFn: api.groups.list,
  });

  // const addUserToGroup = useMutation({
  //   mutationFn: api.groups.add_user_to_group,
  // });

  // const removeUserFromGroup = useMutation({
  //   mutationFn: api.groups.remove_user_from_group,
  // });

  const groups =
    groupsData?.data.map(group => {
      return { id: group.id, name: group.display_name };
    }) ?? [];
  const roles = filterRoles(groups.map(group => group.name));

  const countryOptions = countries.map(country => ({
    value: country.name,
    label: country.name,
  }));

  // todo fix the options,
  const roleOptions = roles.map(role => ({
    value: role,
    label: role,
  }));

  // datasetoptions should be built from what the current country has datasets available for
  const dataSetOptions = [
    "School Coverage",
    "School Geolocation",
    "School QoS",
  ].map(dataset => ({
    value: dataset,
    label: dataset,
  }));

  const [form] = Form.useForm();

  const handleCancelForm = () => setIsEditModalOpen(false);

  // TODO make fetching more aggressive?
  // optimistic updates

  //validation, no duplicate country combinations allowed
  return (
    <Form.Provider
      onFormFinish={(name, { values, forms }) => {
        if (name === "editUserForm") {
          const conutryDatasetValues: CountryDataset[] = values.countryDataset;
          const roleValues: string[] = values.role;
          const emailValue: string = values.email;

          const addedDatasets = conutryDatasetValues
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
              const finalCountry = conutryDatasetValues.find(
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

          const newEmail = emailValue !== initialEmail ? emailValue : "";

          console.log(addedDatasets);
          console.log(removedDatasets);

          console.log(addedRoles);
          console.log(removedRoles);

          console.log(newEmail);

          const addedDatasetsWithIds = matchNamesWithIds(addedDatasets, groups);
          const removedDatasetsWithIds = matchNamesWithIds(
            removedDatasets,
            groups,
          );

          const addedRolesWithIds = matchNamesWithIds(addedRoles, groups);
          const removedRolesWithIds = matchNamesWithIds(removedRoles, groups);

          console.log(addedDatasetsWithIds);
          console.log(removedDatasetsWithIds);
          console.log(addedRolesWithIds);
          console.log(removedRolesWithIds);

          console.log(newEmail);
        }
      }}
    >
      <Modal
        cancelButtonProps={{ className: "rounded-none" }}
        cancelText="Cancel"
        centered={true}
        okButtonProps={{
          // disabled:
          //   countriesToAdd.length === 0 && countriesToRemove.length === 0,
          className: "rounded-none bg-primary",
        }}
        okText="Confirm"
        open={isEditModalOpen && !swapModal}
        title="Modify User Access"
        width={"75%"}
        onCancel={handleCancelForm}
        onOk={() => {
          form.submit();
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
          name="editUserForm"
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
    </Form.Provider>
  );
}
