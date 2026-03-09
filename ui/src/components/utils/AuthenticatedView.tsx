import { PropsWithChildren } from "react";

import {
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
} from "@azure/msal-react";

import Login from "@/components/landing/Login.tsx";

const isLocal = import.meta.env.VITE_PYTHON_ENV === "local";

function AuthenticatedView(props: PropsWithChildren) {
  if (isLocal) {
    return <>{props.children}</>;
  }

  return (
    <>
      <AuthenticatedTemplate>{props.children}</AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <Login />
      </UnauthenticatedTemplate>
    </>
  );
}

export default AuthenticatedView;
