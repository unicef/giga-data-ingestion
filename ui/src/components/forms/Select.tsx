import { ComponentProps, forwardRef } from "react";

import { Select as CarbonSelect } from "@carbon/react/lib/components/Select";

interface SelectProps extends ComponentProps<typeof CarbonSelect> {
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (props, ref) => <CarbonSelect {...props} ref={ref} />,
);
