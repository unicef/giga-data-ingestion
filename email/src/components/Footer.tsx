import { Hr, Text } from "@react-email/components";
import type { ReactElement } from "react";

interface FooterProps {
  children: ReactElement;
}

function Footer({ children }: FooterProps) {
  return (
    <>
      <Hr className="mx-0 my-7 w-full border border-giga-light-gray border-solid" />
      <Text className="leading-6] text-giga-gray text-xs">{children}</Text>
    </>
  );
}

export default Footer;
