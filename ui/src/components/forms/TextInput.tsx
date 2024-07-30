import { type ComponentProps, forwardRef } from "react";

import { TextInput as CarbonTextInput } from "@carbon/react";

interface TextInputProps extends ComponentProps<typeof CarbonTextInput> {
  placeholder?: string;
}

export const TextInput = forwardRef<HTMLSelectElement, TextInputProps>((props, ref) => (
  <CarbonTextInput {...props} ref={ref} />
));
