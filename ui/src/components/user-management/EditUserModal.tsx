import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { CloseCircleOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Input, Modal, Select } from "antd";

import { useApi } from "@/api";
import { countries as COUNTRIES } from "@/constants/countries";
import { GraphUser } from "@/types/user";
import { filterCountries, filterRoles } from "@/utils/countries";

interface EditUserModalProps {
  initialValues: GraphUser;
  isEditModalOpen: boolean;
  setIsEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface IFormInputs {
  user: string;
  email: string;
  countries: string[];
  roles: string[];
}

export default function EditUserModal({
  initialValues,
  isEditModalOpen,
  setIsEditModalOpen,
}: EditUserModalProps) {
  const user = initialValues.display_name;
  const email = initialValues.mail;
  const initialCountries = filterCountries(
    initialValues.member_of.map(group => group.display_name),
  );
  const initialRoles = filterRoles(
    initialValues.member_of.map(group => group.display_name),
  );

  const { handleSubmit, control, setValue } = useForm<IFormInputs>();

  useEffect(() => {
    setValue("user", user ?? "");
    setValue("email", email ?? "");
    setValue("countries", initialCountries ?? "");
    setValue("roles", initialRoles ?? "");
  }, [setValue, email, user, initialCountries, initialRoles]);

  const api = useApi();

  const { isLoading: groupsIsLoading, data: groupsData } = useQuery({
    queryKey: ["groups"],
    queryFn: api.groups.list,
  });


  const removeUserFromGroup = useMutation({
    mutationFn: api.groups.remove_user_from_group,
  });

  const groups = groupsData?.data?.map(group => group.display_name) ?? [];

  const countries = filterCountries(groups);
  const roles = filterRoles(groups);

  const countryOptions = countries.map(country => ({
    value: country,
    label: country,
  }));
  const roleOptions = roles.map(role => ({
    value: role,
    label: role,
  }));

  const onSubmit = (data: any) => {
    console.log("loggers");
    console.log(user);
    console.log(email);
  };
  const handleCancelForm = () => setIsEditModalOpen(false);

  return (
    <>
      {groupsIsLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="rtwerwe">
          <Modal
            centered={true}
            title="Modify User"
            okText="Confirm"
            cancelText="Cancel"
            okButtonProps={{ className: "rounded-none bg-primary" }}
            cancelButtonProps={{ className: "rounded-none" }}
            open={isEditModalOpen}
            onOk={handleSubmit(onSubmit)}
            onCancel={handleCancelForm}
            width={"40%"}
          >
            <form onSubmit={handleSubmit(onSubmit)}>
              <Controller
                name="user"
                control={control}
                render={({ field }) => (
                  <Input defaultValue={"string"} {...field} />
                )}
              />
              <Controller
                name="email"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
              <Controller
                name="countries"
                control={control}
                render={({ field }) => (
                  <Select
                    allowClear
                    mode="multiple"
                    options={countryOptions}
                    {...field}
                  />
                )}
              />
              <Controller
                name="roles"
                control={control}
                render={({ field }) => (
                  <Select
                    allowClear
                    mode="multiple"
                    options={roleOptions}
                    {...field}
                  />
                )}
              />
            </form>
          </Modal>
          {/* <Modal
            centered={true}
            classNames={{ header: "border-b pb-1" }}
            closeIcon={<CloseCircleOutlined />}
            // confirmLoading={confirmLoading}
            cancelButtonProps={{ className: "rounded-none" }}
            okButtonProps={{ className: "rounded-none bg-primary" }}
            okText="Confirm"
            open={isConfirmationModalOpen}
            // onOk={handleOkConfirm}
            // onCancel={handleCancelConfirm}
            title="Add new user"
          >
            <p>
              This will give the user with email <strong>{inputEmail}</strong>{" "}
              access to <strong>{inputCountries.length}</strong>{" "}
              {inputCountries.length > 1 ? "countries, " : "country, "}
              <strong>{formattedCountries}</strong> as{" "}
              <strong>{inputRole}</strong>
            </p>
            <p>&nbsp;</p>
            <p>Is this correct?</p>
          </Modal> */}
        </div>
      )}
    </>
  );
}
