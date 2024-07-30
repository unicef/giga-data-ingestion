import { useCallback } from "react";

import { useMsal } from "@azure/msal-react";

import { axi } from "@/api";
import { loginRequest } from "@/lib/auth.ts";

function useGetToken() {
  const { instance } = useMsal();

  return useCallback(async () => {
    try {
      const result = await instance.acquireTokenSilent(loginRequest);
      axi.defaults.headers.common.Authorization = `Bearer ${result.accessToken}`;
      return result;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, [instance]);
}

export default useGetToken;
