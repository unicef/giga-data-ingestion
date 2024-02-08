import { ComponentProps } from "react";
import { Control, FieldPath, useController } from "react-hook-form";

import { DatePicker, DatePickerInput } from "@carbon/react";

import { MetadataFormValues } from "@/types/metadata.ts";

type DatePickerProps = Omit<ComponentProps<typeof DatePicker>, "children">;

type DatePickerInputProps = React.ComponentProps<typeof DatePickerInput>;

interface ControlledDatepickerProps {
  control: Control<MetadataFormValues>;
  name: FieldPath<MetadataFormValues>;
  datePickerProps: DatePickerProps;
  datePickerInputProps: DatePickerInputProps;
}

const ControlledDatepicker = ({
  control,
  name,
  datePickerProps,
  datePickerInputProps,
}: ControlledDatepickerProps) => {
  const { field, fieldState } = useController({
    name,
    control,
    rules: { required: true },
  });

  return (
    <DatePicker onChange={field.onChange} {...datePickerProps}>
      <DatePickerInput
        invalid={fieldState.invalid}
        onChange={field.onChange}
        {...datePickerInputProps}
      />
    </DatePicker>
  );
};

export default ControlledDatepicker;
