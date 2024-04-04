import { Hr, Text } from "@react-email/components";
import { ReactElement } from "react";

interface FooterProps {
  children: ReactElement;
}

function Footer({ children }: FooterProps) {
  return (
    <>
      <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
      <Text className="text-giga-gray text-xs leading-6]">{children}</Text>
    </>
  );
}

export default Footer;
