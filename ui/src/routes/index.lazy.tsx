import {
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
} from "@azure/msal-react";
import { createLazyFileRoute } from "@tanstack/react-router";

import Landing from "@/components/landing/Landing.tsx";
import Login from "@/components/landing/Login.tsx";
import FetchUserGroups from "@/components/utils/FetchUserGroups.tsx";

export const Route = createLazyFileRoute("/")({
  component: () => (
    <>
      <AuthenticatedTemplate>
        <FetchUserGroups />
        <Landing />
      </AuthenticatedTemplate>

      <UnauthenticatedTemplate>
        <Login />
      </UnauthenticatedTemplate>
    </>
  ),
});
