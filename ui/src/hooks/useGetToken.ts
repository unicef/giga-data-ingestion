import { useCallback } from "react";

import { useMsal } from "@azure/msal-react";

import { axi } from "@/api";
import { loginRequest } from "@/lib/auth.ts";

const isLocal = import.meta.env.VITE_PYTHON_ENV === "local";

function useGetToken() {
  const { instance } = useMsal();

  async function getToken() {
    if (isLocal) {
      delete axi.defaults.headers.common["Authorization"];
      return "";
    }

    try {
      const result = await instance.acquireTokenSilent(loginRequest);
      const bearer = !!result.accessToken ? result.accessToken : result.idToken;

      axi.defaults.headers.common["Authorization"] = `Bearer ${bearer}`;
      return bearer;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  return useCallback(getToken, [instance]);
}

export default useGetToken;
