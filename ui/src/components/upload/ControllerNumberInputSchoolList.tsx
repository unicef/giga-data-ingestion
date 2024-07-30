import type { ComponentProps } from "react";
import { type Control, type FieldPath, useController } from "react-hook-form";

import { NumberInput } from "@carbon/react";

import type { SchoolListFormValues } from "@/types/qos";

type NumberInputProps = ComponentProps<typeof NumberInput>;

interface ControlledDatepickerProps {
  control: Control<SchoolListFormValues>;
  name: FieldPath<SchoolListFormValues>;
  numberInputProps: NumberInputProps;
}

const ControllerNumberInputSchoolList = ({
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
            ? Number.parseInt(value.value, 10)
            : value.value,
        );
      }}
      {...numberInputProps}
    />
  );
};

export default ControllerNumberInputSchoolList;
