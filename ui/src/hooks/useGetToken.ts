import { useCallback } from "react";

import { useMsal } from "@azure/msal-react";

import { axi } from "@/api";
import { loginRequest } from "@/lib/auth.ts";

function useGetToken() {
  const { instance } = useMsal();

  const getToken = useCallback(async () => {
    const result = await instance.acquireTokenSilent(loginRequest);
    axi.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${result.accessToken}`;
  }, [instance]);

  return getToken;
}

export default useGetToken;
