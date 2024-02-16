import {
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
} from "@azure/msal-react";
import { createFileRoute } from "@tanstack/react-router";

import Landing from "@/components/landing/Landing.tsx";
import Login from "@/components/landing/Login";

export const Route = createFileRoute("/")({
  component: () => (
    <>
      <AuthenticatedTemplate>
        <Landing />
      </AuthenticatedTemplate>

      <UnauthenticatedTemplate>
        <Login />
      </UnauthenticatedTemplate>
    </>
  ),
});
