import type { PropsWithChildren } from "react";

import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";

import Login from "@/components/landing/Login.tsx";

function AuthenticatedView(props: PropsWithChildren) {
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
