import { Hr, Text } from "@react-email/components";
import type { ReactElement } from "react";

interface FooterProps {
  children: ReactElement;
}

function Footer({ children }: FooterProps) {
  return (
    <>
      <Hr className="border border-solid border-giga-light-gray my-7 mx-0 w-full" />
      <Text className="text-giga-gray text-xs leading-6]">{children}</Text>
    </>
  );
}

export default Footer;
