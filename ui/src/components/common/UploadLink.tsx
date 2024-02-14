import { ReactNode } from "react";



import { Add } from "@carbon/icons-react";
import { Link } from "@tanstack/react-router";


type UploadLinkProps = {
  uploadType: string;
  children: ReactNode;
};

export const UploadLink = ({ uploadType, children }: UploadLinkProps) => {
  return (
    <Link
      to={`/upload/$uploadGroup/$uploadType`}
      params={{
        uploadGroup: "school-data",
        uploadType,
      }}
    >
      <button className="flex w-64 flex-col items-center justify-center border-2 border-solid border-blue-500 bg-white px-10 py-6 text-blue-500 ring-0 ring-inset ring-white transition-colors duration-200 hover:border-white hover:bg-blue-500 hover:text-white active:border-blue-500 active:bg-blue-900 active:text-white active:ring-2">
        <Add size={32} className="mb-2 fill-current" />
        <span>{children}</span>
      </button>
    </Link>
  );
};