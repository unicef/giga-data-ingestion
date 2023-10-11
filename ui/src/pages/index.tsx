import {
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
} from "@azure/msal-react";

import Landing from "@/components/landing/Landing.tsx";
import Login from "@/components/landing/Login.tsx";

function App() {
  return (
    <>
      <AuthenticatedTemplate>
        <Landing />
      </AuthenticatedTemplate>

      <UnauthenticatedTemplate>
        <Login />
      </UnauthenticatedTemplate>
    </>
  );
}

export default App;
