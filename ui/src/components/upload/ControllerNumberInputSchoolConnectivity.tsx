import { ComponentProps } from "react";
import { Control, FieldPath, useController } from "react-hook-form";

import { NumberInput } from "@carbon/react";

import { SchoolConnectivityFormValues } from "@/types/qos";

type NumberInputProps = ComponentProps<typeof NumberInput>;

interface ControlledDatepickerProps {
  control: Control<SchoolConnectivityFormValues>;
  name: FieldPath<SchoolConnectivityFormValues>;
  numberInputProps: NumberInputProps;
}

const ControllerNumberInputSchoolConnectivity = ({
  control,
  name,
  numberInputProps,
}: ControlledDatepickerProps) => {
  const { field, fieldState } = useController({
    name,
    control,
    rules: { required: true },
  });

  return (
    <NumberInput
      invalid={fieldState.invalid}
      onChange={(_, value) => {
        field.onChange(
          typeof value.value === "string"
            ? parseInt(value.value, 10)
            : value.value,
        );
      }}
      {...numberInputProps}
    />
  );
};

export default ControllerNumberInputSchoolConnectivity;
