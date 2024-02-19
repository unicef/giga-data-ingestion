import { useCallback } from "react";

import { useAccount, useMsal } from "@azure/msal-react";

import { logoutRequest } from "@/lib/auth.ts";

function useLogout() {
  const { instance } = useMsal();
  const account = useAccount();

  const logout = useCallback(async () => {
    await instance.logout({
      ...logoutRequest,
      account,
    });
  }, [account, instance]);

  return logout;
}

export default useLogout;
