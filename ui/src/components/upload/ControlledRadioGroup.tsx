import { Control, useController } from "react-hook-form";

import { RadioButtonGroup } from "@carbon/react";
import { RadioButtonGroupProps } from "carbon-components-react";

interface ControlledRadioGroupProps extends RadioButtonGroupProps {
  children: JSX.Element | JSX.Element[];
  control: Control;
  name: string;
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
