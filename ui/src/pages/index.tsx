import { useEffect } from "react";

import {
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
  useMsal,
} from "@azure/msal-react";

import { axi } from "@/api";
import Landing from "@/components/landing/Landing.tsx";
import Login from "@/components/landing/Login.tsx";
import { loginRequest } from "@/lib/auth.ts";
import { useStore } from "@/store.ts";

function App() {
  const { setUser } = useStore();
  const { accounts, instance } = useMsal();

  useEffect(() => {
    (async () => {
      if (accounts.length > 0) {
        const account = accounts[0];
        setUser({
          name: account.name ?? "",
          email: account.username,
          roles: account.idTokenClaims?.roles ?? [],
        });

        const result = await instance.acquireTokenSilent(loginRequest);
        axi.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${result.accessToken}`;
      }
    })();
  }, [accounts, instance, setUser]);

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
