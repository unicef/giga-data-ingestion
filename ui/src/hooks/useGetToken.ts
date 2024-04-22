import { useCallback } from "react";

import { useMsal } from "@azure/msal-react";

import { axi } from "@/api";
import { loginRequest } from "@/lib/auth.ts";

function useGetToken() {
  const { instance } = useMsal();

  async function getToken() {
    try {
      const result = await instance.acquireTokenSilent(loginRequest);
      axi.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${result.accessToken}`;
      return result;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  return useCallback(getToken, [instance]);
}

export default useGetToken;
