import { Control, useController } from "react-hook-form";

import { RadioButtonGroup } from "@carbon/react";

interface ControlledRadioGroupProps {
  children: JSX.Element | JSX.Element[];

  control: Control;
  label: string;
  name: string;
}

const ControlledRadioGroup = ({
  children,
  control,
  label,
  name,
}: ControlledRadioGroupProps) => {
  const { field } = useController({
    name,
    control,
    rules: { required: true },
  });

  return (
    <RadioButtonGroup
      legendText={label}
      name={field.name}
      onChange={field.onChange}
      defaultSelected="radio-1"
    >
      {children}
    </RadioButtonGroup>
  );
};

export default ControlledRadioGroup;
