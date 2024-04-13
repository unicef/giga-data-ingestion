import { ComponentProps, PropsWithChildren } from "react";

import {
  HeaderName as CarbonHeaderName,
  HeaderNavigation as CarbonHeaderNavigation,
} from "@carbon/react";

type HeaderNameProps = Partial<ComponentProps<typeof CarbonHeaderName>> &
  PropsWithChildren;

export function HeaderName({ children, ...props }: HeaderNameProps) {
  return <CarbonHeaderName {...props}>{children}</CarbonHeaderName>;
}

type HeaderNavigationProps = Partial<
  ComponentProps<typeof CarbonHeaderNavigation>
> &
  PropsWithChildren;

export function HeaderNavigation({
  children,
  ...props
}: HeaderNavigationProps) {
  return <CarbonHeaderNavigation {...props}>{children}</CarbonHeaderNavigation>;
}
