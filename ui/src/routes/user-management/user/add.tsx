import { useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

import { Add } from "@carbon/icons-react";
import {
  Button,
  Checkbox,
  Form,
  FormGroup,
  InlineNotification,
  Modal,
  SelectItem,
  Stack,
  TextInput,
  ToastNotification,
} from "@carbon/react";
import {
  queryOptions,
  useMutation,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { api } from "@/api";
import { listCountriesQueryOptions } from "@/api/queryOptions.ts";
import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { PendingComponent } from "@/components/common/PendingComponent.tsx";
import { Select } from "@/components/forms/Select.tsx";
import { DatabaseRole } from "@/types/group.ts";
import { CreateUserRequest } from "@/types/user.ts";
import { filterRoles, matchNamesWithIds } from "@/utils/group.ts";
import { validateSearchParams } from "@/utils/pagination.ts";

const rolesQueryOptions = queryOptions({
  queryKey: ["roles"],
  queryFn: api.roles.list,
});

export const Route = createFileRoute("/user-management/user/add")({
  component: AddUser,
  loader: ({ context: { queryClient } }) => {
    return Promise.all([
      queryClient.ensureQueryData(rolesQueryOptions),
      queryClient.ensureQueryData(listCountriesQueryOptions),
    ]);
  },
  validateSearch: validateSearchParams,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

type CountryDataset = {
  country: string;
  dataset: { selectedItems: { label: string; value: string }[] };
};

interface AddUserInputs {
  givenName: string;
  surname: string;
  email: string;
  roles: { selectedItems: { label: string; value: string }[] };
  countryDatasets: CountryDataset[];
}

interface AddUserInputs {
  givenName: string;
  surname: string;
  email: string;
  roles: { selectedItems: { label: string; value: string }[] };
  countryDatasets: CountryDataset[];
}

const initialCountryDataset: CountryDataset = {
  country: "",
  dataset: { selectedItems: [] },
};

function AddUser() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { page, page_size } = Route.useSearch();
  const { queryClient } = Route.useRouteContext();
  const [swapModal, setSwapModal] = useState<boolean>(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [showErrorNotification, setShowErrorNotification] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState,
    watch,
    getValues,
    setValue,
    reset,
  } = useForm<AddUserInputs>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      roles: { selectedItems: [] },
      countryDatasets: [initialCountryDataset],
    },
  });

  const watchedCountryDatasets = watch("countryDatasets");
  const watchedRoles = watch("roles");

  const {
    data: { data: countries },
  } = useSuspenseQuery(listCountriesQueryOptions);

  const countryOptions = countries.map(country => ({
    value: country.name_short,
    label: country.name_short,
  }));

  const { data: groupsData } = useSuspenseQuery(rolesQueryOptions);

  const rawGroups = groupsData?.data ?? [];
  const groups =
    rawGroups.map(group => {
      return { id: group.id, name: group.name };
    }) ?? [];
  const roles = filterRoles(groups.map(group => group.name));

  const roleOptions = roles.map(role => ({
    value: role,
    label: role,
  }));

  const {
    mutateAsync: createUser,
    isPending: isCreateUserPending,
    isError: isCreateUserError,
  } = useMutation({
    mutationFn: api.users.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
  });

  const dataSetOptions = [
    "School Coverage",
    "School Geolocation",
    "School QoS",
  ].map(dataset => ({
    value: dataset,
    label: dataset,
  }));

  const handleModalCancel = async (modalName: "AddModal" | "ConfirmModal") => {
    setSwapModal(false);
    if (modalName === "AddModal")
      await navigate({
        to: "../..",
        search: {
          page,
          page_size,
        },
      });
  };

  const handleAddCountryDataset = () => {
    setValue("countryDatasets", [
      ...watchedCountryDatasets,
      { ...initialCountryDataset },
    ]);
  };

  const handleRemoveCountryDataset = (index: number) => {
    const countryDatasets = [...watchedCountryDatasets];
    countryDatasets.splice(index, 1);
    setValue("countryDatasets", countryDatasets);
  };

  const deriveAddedValues = () => {
    const roles = [...watchedRoles.selectedItems];
    const addedDatasets = watchedCountryDatasets
      .map(({ country, dataset }) => {
        return {
          country,
          dataset: dataset.selectedItems,
        };
      })
      .filter(({ dataset }) => dataset.length > 0)
      .flatMap(({ country, dataset }) =>
        dataset.map(ds => {
          return `${country}-${ds.value}`;
        }),
      );

    const addedDatasetsWithIds = matchNamesWithIds(addedDatasets, groups);
    const addedRolesWithIds = matchNamesWithIds(
      roles.map(role => role.value),
      groups,
    );

    return { addedDatasets, addedDatasetsWithIds, addedRolesWithIds };
  };

  const onSubmit: SubmitHandler<AddUserInputs> = async data => {
    const { givenName, surname, email } = data;

    const { addedDatasetsWithIds, addedRolesWithIds } = deriveAddedValues();
    const groupIdsToAdd = [
      ...addedDatasetsWithIds.map(
        addedDatasetWithId => addedDatasetWithId.id ?? "",
      ),
      ...addedRolesWithIds.map(addedRoleWithId => addedRoleWithId.id ?? ""),
    ];
    const addGroupsPayload: CreateUserRequest = {
      roles: groupIdsToAdd
        .map(id => rawGroups.find(group => group.id === id))
        .filter(Boolean) as DatabaseRole[],
      given_name: givenName,
      surname,
      email,
    };

    try {
      await createUser(addGroupsPayload);
      setShowSuccessNotification(true);
      reset();
      setSwapModal(false);
      await navigate({ to: "../..", search: { page, page_size } });
    } catch (err) {
      console.error(err);
      setShowErrorNotification(true);
    }
  };

  return (
    <>
      <Modal
        aria-label="add user modal"
        hasScrollingContent
        modalHeading="Add New User"
        open={!swapModal}
        primaryButtonDisabled={!formState.isValid}
        primaryButtonText="Confirm"
        secondaryButtonText="Cancel"
        onRequestClose={() => handleModalCancel("AddModal")}
        onRequestSubmit={() => setSwapModal(true)}
      >
        <form aria-label="add user form" className="mb-12">
          <Stack gap={4}>
            <TextInput
              id="givenName"
              labelText="First Name"
              {...register("givenName", { required: true })}
            />
            <TextInput
              id="surname"
              labelText="Last Name"
              {...register("surname", { required: true })}
            />
            <TextInput
              id="email"
              labelText="Email"
              type="email"
              {...register("email", { required: true })}
            />
            <Controller
              name="roles"
              control={control}
              render={({ field: { onChange, value } }) => (
                <FormGroup legendText="Role">
                  <p className="cds--label">
                    What level of access does this user have for Giga?
                  </p>
                  {roleOptions.map(option => (
                    <Checkbox
                      key={option.value}
                      id={`role-${option.value}`}
                      labelText={option.label}
                      checked={value.selectedItems.some(
                        item => item.value === option.value,
                      )}
                      onChange={(_, { checked }) => {
                        const currentSelection = value.selectedItems;
                        const newSelectedItems = checked
                          ? [...currentSelection, option]
                          : currentSelection.filter(
                              item => item.value !== option.value,
                            );
                        onChange({ selectedItems: newSelectedItems });
                      }}
                    />
                  ))}
                </FormGroup>
              )}
              rules={{
                validate: value =>
                  (value.selectedItems?.length ?? 0) > 0 ||
                  "Select at least one role",
              }}
            />

            {watchedCountryDatasets.map((_, i) => (
              <FormGroup key={i} legendText="">
                <Select
                  id={`country.${i}`}
                  labelText={`Country ${i + 1}`}
                  placeholder="select a country"
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
                    render={({ field: { onChange, value } }) => (
                      <FormGroup legendText="Select datasets">
                        {dataSetOptions.map(option => (
                          <Checkbox
                            key={option.value}
                            id={`dataset-${i}-${option.value.replace(
                              /\s/g,
                              "",
                            )}`}
                            labelText={option.label}
                            checked={value.selectedItems.some(
                              item => item.value === option.value,
                            )}
                            onChange={(_, { checked }) => {
                              const currentSelection = value.selectedItems;
                              const newSelectedItems = checked
                                ? [...currentSelection, option]
                                : currentSelection.filter(
                                    item => item.value !== option.value,
                                  );
                              onChange({ selectedItems: newSelectedItems });
                            }}
                          />
                        ))}
                      </FormGroup>
                    )}
                    rules={{
                      validate: value =>
                        (value.selectedItems?.length ?? 0) > 0 ||
                        "Select at least one dataset",
                    }}
                  />
                </FormGroup>
                {i + 1 < watchedCountryDatasets.length && (
                  <hr className="mt-8 opacity-30" />
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
      </Modal>

      {swapModal && (
        <Modal
          aria-label="confirm new user modal"
          loadingStatus={isCreateUserPending ? "active" : "inactive"}
          modalHeading="Confirm New User"
          open={swapModal}
          primaryButtonText="Confirm"
          secondaryButtonText="Cancel"
          onRequestClose={() => handleModalCancel("ConfirmModal")}
          onRequestSubmit={handleSubmit(onSubmit)}
        >
          <Form aria-label="confirm new user form" className="">
            <p>
              This will give the user with email <b>{getValues("email")}</b> the
              following privileges and access to Giga data:
              <ul className="list-disc pl-6">
                {getValues("roles").selectedItems.map(role => (
                  <li key={role.value}>{role.label}</li>
                ))}
                {getValues("countryDatasets").map(({ country, dataset }) =>
                  dataset.selectedItems.map(ds => (
                    <li key={`${country}-${ds.value}`}>
                      {country}-{ds.label}
                    </li>
                  )),
                )}
              </ul>
            </p>

            {isCreateUserError && (
              <InlineNotification
                aria-label="create user error notification"
                kind="error"
                statusIconDescription="notification"
                subtitle="Operation failed. Please try again."
                title="Error"
              />
            )}
          </Form>
        </Modal>
      )}

      {showSuccessNotification && (
        <ToastNotification
          aria-label="create user success notification"
          kind="success"
          caption="User successfully added. Please wait a moment or refresh the page for updates"
          onClose={() => setShowSuccessNotification(false)}
          onCloseButtonClick={() => setShowSuccessNotification(false)}
          statusIconDescription="success"
          timeout={5000}
          title="Create user success"
          className="absolute right-0 top-0 mx-6 my-16"
        />
      )}
      {showErrorNotification && (
        <ToastNotification
          aria-label="create user error notification"
          kind="error"
          caption="Operation failed. Please try again"
          onClose={() => setShowErrorNotification(false)}
          onCloseButtonClick={() => setShowErrorNotification(false)}
          statusIconDescription="error"
          timeout={5000}
          title="Create user error"
          className="absolute right-0 top-0 mx-6 my-16"
        />
      )}
    </>
  );
}
