import { useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

import { Add } from "@carbon/icons-react";
import {
  Button,
  Form,
  FormGroup,
  InlineNotification,
  Modal,
  SelectItem,
  Stack,
  TextInput,
  ToastNotification,
} from "@carbon/react";
import MultiSelect from "@carbon/react/lib/components/MultiSelect/MultiSelect";
import {
  queryOptions,
  useMutation,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { api, queryClient } from "@/api";
import { Select } from "@/components/forms/Select.tsx";
import countries from "@/constants/countries.ts";
import { filterRoles, matchNamesWithIds } from "@/utils/group.ts";
import {
  getUniqueDatasets,
  pluralizeCountries,
  pluralizeDatasets,
} from "@/utils/string.ts";

export const Route = createFileRoute("/user-management/user/add")({
  component: AddUser,
  loader: Loader,
});

const groupsQueryOptions = queryOptions({
  queryKey: ["groups"],
  queryFn: api.groups.list,
});

function Loader() {
  return queryClient.ensureQueryData(groupsQueryOptions);
}

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

  const countryOptions = countries.map(country => ({
    value: country.name,
    label: country.name,
  }));

  const { data: groupsData } = useSuspenseQuery(groupsQueryOptions);

  const groups =
    groupsData?.data.map(group => {
      return { id: group.id, name: group.display_name };
    }) ?? [];
  const roles = filterRoles(groups.map(group => group.name));

  const roleOptions = roles.map(role => ({
    value: role,
    label: role,
  }));

  const {
    mutateAsync: mutateInviteAndAddGroups,
    isPending: isInviteMutationPending,
  } = useMutation({
    mutationFn: api.users.inviteAndAddGroups,
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
    if (modalName === "AddModal") await navigate({ to: "../.." });
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
    const addGroupsPayload = {
      groups_to_add: [
        ...addedDatasetsWithIds.map(
          addedDatasetWithId => addedDatasetWithId.id ?? "",
        ),
        ...addedRolesWithIds.map(addedRoleWithId => addedRoleWithId.id ?? ""),
      ],
      invited_user_display_name: `${givenName} ${surname}`,
      invited_user_given_name: givenName,
      invited_user_surname: surname,
      invited_user_email_address: email,
    };

    try {
      await mutateInviteAndAddGroups(addGroupsPayload);
      setShowSuccessNotification(true);
      reset();
      setSwapModal(false);
      await navigate({ to: "../.." });
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
        <form aria-label="add user form">
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
            <FormGroup legendId="role" legendText="Role">
              <Controller
                name="roles"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    id="roles"
                    items={roleOptions}
                    itemToString={item => item.label}
                    label="What level of access does this user have for Giga?"
                    {...field}
                  />
                )}
                rules={{ required: true, minLength: 1 }}
              />
            </FormGroup>

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
                    render={({ field }) => (
                      <MultiSelect
                        id={`dataset.${i}`}
                        items={dataSetOptions}
                        label="Select datasets"
                        itemToString={item => item.label}
                        {...field}
                      />
                    )}
                    rules={{ required: true, minLength: 1 }}
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
          loadingStatus={isInviteMutationPending ? "active" : "inactive"}
          modalHeading="Confirm New User"
          open={swapModal}
          primaryButtonText="Confirm"
          secondaryButtonText="Cancel"
          onRequestClose={() => handleModalCancel("ConfirmModal")}
          onRequestSubmit={handleSubmit(onSubmit)}
        >
          <Form aria-label="confirm new user form" className="">
            {(() => {
              const countries = getUniqueDatasets(
                getValues("email"),
                deriveAddedValues().addedDatasetsWithIds,
              ).countries;
              const datasets = pluralizeDatasets(
                getUniqueDatasets(
                  getValues("email"),
                  deriveAddedValues().addedDatasetsWithIds,
                ).uniqueDatasets,
              );

              return (
                <p>
                  This will give the user with email <b>{getValues("email")}</b>{" "}
                  access to Giga data for <b>{datasets}</b> across{" "}
                  {countries.length}{" "}
                  {countries.length === 1 ? "country" : "countries"}:{" "}
                  <b>{pluralizeCountries(countries)}</b>.
                </p>
              );
            })()}

            {isInviteMutationPending && (
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
