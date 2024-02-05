import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Controller, useForm } from "react-hook-form";

import { Add } from "@carbon/icons-react";
import {
  Button,
  FormGroup,
  Modal,
  Select,
  SelectItem,
  Stack,
  TextInput,
} from "@carbon/react";
import MultiSelect from "@carbon/react/lib/components/MultiSelect/MultiSelect";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useApi } from "@/api";
import countries from "@/constants/countries";
import { GraphUser } from "@/types/user";
import { filterCountries, filterRoles } from "@/utils/group";
import { matchNamesWithIds } from "@/utils/group";
import {
  getUniqueDatasets,
  pluralizeCountries,
  pluralizeDatasets,
} from "@/utils/string";

interface EditUserModalProps {
  initialValues: GraphUser;
  isEditModalOpen: boolean;
  setIsEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

type CountryDataset = {
  country: string;
  dataset: { selectedItems: { label: string; value: string }[] };
};

interface EditUserInputs {
  givenName: string;
  surname: string;
  email: string;
  roles: { selectedItems: { label: string; value: string }[] };
  countryDatasets: CountryDataset[];
}

export default function EditUserModal({
  initialValues,
  isEditModalOpen,
  setIsEditModalOpen,
}: EditUserModalProps) {
  const user = initialValues.display_name;
  const givenName = initialValues.given_name;
  const surname = initialValues.surname;
  const initialEmail = initialValues.mail;
  const initialGroups = initialValues.member_of.map(
    group => group.display_name,
  );

  const api = useApi();

  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [swapModal, setSwapModal] = useState<boolean>(false);
  const [submittable, setSubmittable] = useState(false);

  const [display, setIsDisplay] = useState(false);

  const { data: groupsData } = useQuery({
    queryKey: ["groups"],
    queryFn: api.groups.list,
  });

  const groups =
    groupsData?.data.map(group => {
      return { id: group.id, name: group.display_name };
    }) ?? [];

  const roles = filterRoles(groups.map(group => group.name));
  const initialRoles = filterRoles(initialGroups);
  const initialCountries = filterCountries(initialGroups);

  const modifyUserAccess = useMutation({
    mutationFn: api.groups.modify_user_access,
  });

  const getInitialCountryDataset = (
    initialCountries: string[],
  ): CountryDataset[] => {
    return initialCountries
      .map(item => {
        const [country, dataset] = item.split("-");
        return {
          country,
          dataset: { selectedItems: [{ value: dataset, label: dataset }] },
        };
      })
      .reduce((acc: CountryDataset[], { country, dataset }) => {
        const existingCountry = acc.find(item => item.country === country);
        if (existingCountry) {
          existingCountry.dataset.selectedItems.push(...dataset.selectedItems);
        } else {
          acc.push({ country, dataset });
        }
        return acc;
      }, []);
  };

  const cool = getInitialCountryDataset(initialCountries);

  const {
    register,
    handleSubmit,
    control,
    formState,
    watch,
    getValues,
    setValue,
    reset,
  } = useForm<EditUserInputs>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      roles: {
        selectedItems: initialRoles.map(role => ({
          label: role,
          value: role,
        })),
      },
      countryDatasets: [...cool],
    },
  });

  //

  const handleAddCountryDataset = () => {
    setValue("countryDatasets", [
      ...watchedCountryDatasets,
      { ...initialCountryDataset },
    ]);
  };

  const watchedCountryDatasets = watch("countryDatasets");
  const watchedRoles = watch("roles");

  // const initialCountries = filterCountries(initialGroups);
  // const initialRoles = filterRoles(initialGroups);

  // const initialCountryDataset = getInitialCountryDataset(initialCountries);

  // const groups =
  //   groupsData?.data.map(group => {
  //     return { id: group.id, name: group.display_name };
  //   }) ?? [];
  // const roles = filterRoles(groups.map(group => group.name));

  // const onOk = () => {
  //   form.submit();
  // };

  // const values = Form.useWatch([], form);
  // useEffect(() => {
  //   form.validateFields({ validateOnly: true }).then(
  //     () => {
  //       setSubmittable(true);
  //     },
  //     () => {
  //       setSubmittable(false);
  //     },
  //   );
  // }, []);

  // new stuff

  const handleModalCancel = (modalName: string) => {
    if (modalName == "EditModal") setIsEditModalOpen(false);
    setSwapModal(false);
    // reset()
  };

  const handleRemoveCountryDataset = (index: number) => {
    const countryDatasets = [...watchedCountryDatasets];
    countryDatasets.splice(index, 1);
    setValue("countryDatasets", countryDatasets);
  };

  const countryOptions = countries.map(country => ({
    value: country.name,
    label: country.name,
  }));

  const dataSetOptions = [
    "School Coverage",
    "School Geolocation",
    "School QoS",
  ].map(dataset => ({
    value: dataset,
    label: dataset,
  }));

  const roleOptions = roles.map(role => ({
    value: role,
    label: role,
  }));

  return (
    <>
      {true &&
        createPortal(
          <Modal
            aria-label="edit user modal"
            hasScrollingContent
            modalHeading="Edit user"
            open={isEditModalOpen && !swapModal}
            preventCloseOnClickOutside
            primaryButtonDisabled={true}
            primaryButtonText="Confirm"
            secondaryButtonText="Cancel"
            onRequestClose={() => handleModalCancel("EditModal")}
            onRequestSubmit={() => setSwapModal(true)}
          >
            {watchedRoles.selectedItems.map(role => role.label)}
            {isEditModalOpen && (
              <form aria-label="edit user form">
                <Stack gap={4}>
                  <TextInput
                    disabled
                    id="givenName"
                    labelText="First Name"
                    value={givenName}
                    {...register("givenName", { required: true })}
                  />
                  <TextInput
                    disabled
                    id="surname"
                    labelText="Last Name"
                    value={surname}
                    {...register("surname", { required: true })}
                  />
                  <TextInput
                    disabled
                    id="email"
                    labelText="Email"
                    value={initialEmail}
                    {...register("email", { required: true })}
                  />
                  <Controller
                    name="roles"
                    control={control}
                    render={({ field }) => (
                      <MultiSelect
                        id="roles"
                        initialSelectedItems={initialRoles.map(role => ({
                          label: role,
                          value: role,
                        }))}
                        items={roleOptions}
                        itemToString={item => item.label}
                        label="What level of access does this user have for Giga?"
                        titleText="Role"
                        {...field}
                      />
                    )}
                    rules={{ required: true, minLength: 1 }}
                  />

                  {watchedCountryDatasets.map((countryDataset, i) => (
                    <FormGroup key={i} legendText="">
                      <Select
                        id={`country.${i}`}
                        labelText={`Country ${i + 1}`}
                        {...register(`countryDatasets.${i}.country`, {
                          required: true,
                        })}
                      >
                        <SelectItem text="Select a country" value="" />
                        {countryOptions.map(country => (
                          <SelectItem
                            key={country.value}
                            text={country.label}
                            value={country.value}
                          />
                        ))}
                      </Select>
                      {watchedCountryDatasets.length > 1 && (
                        <Button
                          kind="ghost"
                          size="sm"
                          onClick={() => handleRemoveCountryDataset(i)}
                        >
                          Remove pair
                        </Button>
                      )}
                      <FormGroup legendText="Dataset">
                        <Controller
                          name={`countryDatasets.${i}.dataset`}
                          control={control}
                          render={({ field }) => (
                            <MultiSelect
                              id={`dataset.${i}`}
                              label="Select datasets"
                              initialSelectedItems={
                                countryDataset.dataset.selectedItems
                              }
                              items={dataSetOptions}
                              itemToString={item => item.label}
                              {...field}
                            />
                          )}
                          rules={{ required: true, minLength: 1 }}
                        />
                      </FormGroup>
                      {i + 1 < watchedCountryDatasets.length && (
                        <hr className="mt-8" />
                      )}
                    </FormGroup>
                  ))}

                  <Button
                    kind="ghost"
                    renderIcon={Add}
                    onClick={handleAddCountryDataset}
                  >
                    Add country
                  </Button>
                </Stack>
              </form>
            )}
          </Modal>,

          document.body,
        )}
    </>
  );
}
// <Form.Provider
//   onFormFinish={async (name, { values, forms }) => {
//     if (name === "editForm") {
//       const countryDatasetValues: CountryDataset[] = values.countryDataset;
//       const roleValues: string[] = values.role;
//       const emailValue: string = values.email;

//       const addedDatasets = countryDatasetValues
//         .map(({ country, dataset }) => {
//           const initialCountry = initialCountryDataset.find(
//             el => el.country === country,
//           );
//           return {
//             country,
//             dataset: dataset.filter(
//               el => !initialCountry?.dataset.includes(el),
//             ),
//           };
//         })
//         .filter(({ dataset }) => dataset.length > 0)
//         .flatMap(({ country, dataset }) =>
//           dataset.map(ds => `${country}-${ds}`),
//         );

//       const removedDatasets = initialCountryDataset
//         .map(({ country, dataset }) => {
//           const finalCountry = countryDatasetValues.find(
//             el => el.country === country,
//           );
//           return {
//             country,
//             dataset: dataset.filter(
//               el => !finalCountry?.dataset.includes(el),
//             ),
//           };
//         })
//         .filter(({ dataset }) => dataset.length > 0)
//         .flatMap(({ country, dataset }) =>
//           dataset.map(ds => `${country}-${ds}`),
//         );

//       const addedRoles = roleValues.filter(
//         element => !initialRoles.includes(element),
//       );
//       const removedRoles = initialRoles.filter(
//         element => !roleValues.includes(element),
//       );

//       const addedDatasetsWithIds = matchNamesWithIds(addedDatasets, groups);
//       const removedDatasetsWithIds = matchNamesWithIds(
//         removedDatasets,
//         groups,
//       );

//       const addedRolesWithIds = matchNamesWithIds(addedRoles, groups);
//       const removedRolesWithIds = matchNamesWithIds(removedRoles, groups);

//       const { confirmForm } = forms;

//       confirmForm.setFieldValue("email", emailValue);
//       confirmForm.setFieldValue("addedRoles", addedRolesWithIds);
//       confirmForm.setFieldValue("removedRoles", removedRolesWithIds);
//       confirmForm.setFieldValue("addedDatasets", addedDatasetsWithIds);
//       confirmForm.setFieldValue("removedDatasets", removedDatasetsWithIds);
//     }

//     if (name === "confirmForm") {
//       const addGroupsPayload = {
//         email: values.email,
//         groups_to_add: [...values.addedDatasets, ...values.addedRoles].map(
//           dataset => dataset.id,
//         ),
//         groups_to_remove: [
//           ...values.removedDatasets,
//           ...values.removedRoles,
//         ].map(dataset => dataset.id),
//         user_id: initialValues.id,
//       };
//       setConfirmLoading(true);

//       try {
//         await modifyUserAccess.mutateAsync(addGroupsPayload);
//         toast.success(
//           "User successfully edited. Please wait a moment or refresh the page for updates",
//         );
//         setSwapModal(false);
//         setIsEditModalOpen(false);
//         setConfirmLoading(false);
//       } catch (err) {
//         toast.error("Operation failed. Please try again");

//         setError(true);
//         setConfirmLoading(false);
//       }
//     }
//   }}
// >
/* <Modal
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
        width={modalWidth}
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
            <Input disabled />
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
      </Modal> */

/* <Modal
        centered={true}
        footer={null}
        open={isEditModalOpen && swapModal}
        title="Confirm user access modification"
        width={modalWidth}
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
                className="rounded-none bg-primary text-white"
                htmlType="submit"
                loading={confirmLoading}
              >
                Confirm
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal> */

{
  /* </Form.Provider>
  ); */
}
