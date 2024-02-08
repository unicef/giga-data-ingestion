import { Control, FieldPath, useController } from "react-hook-form";

import { RadioButtonGroup } from "@carbon/react";

import { MetadataFormValues } from "@/types/metadata";

type RadioButtonGroupProps = Omit<
  React.ComponentProps<typeof RadioButtonGroup>,
  "name"
>;

interface ControlledRadioGroupProps extends RadioButtonGroupProps {
  children: JSX.Element | JSX.Element[];
  control: Control<MetadataFormValues>;
  name: FieldPath<MetadataFormValues>;
}

const ControlledRadioGroup = ({
  children,
  control,
  name,
  ...rest
}: ControlledRadioGroupProps) => {
  const { field, fieldState } = useController({
    name,
    control,
    rules: { required: true },
  });

  return (
    <RadioButtonGroup
      name={name}
      valueSelected={field.value as string}
      invalid={fieldState.invalid}
      invalidText="Select at least one option"
      onChange={field.onChange}
      {...rest}
    >
      {children}
    </RadioButtonGroup>
  );
};

export default ControlledRadioGroup;
