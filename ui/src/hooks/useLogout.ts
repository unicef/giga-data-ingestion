import { useCallback } from "react";

import { useAccount, useMsal } from "@azure/msal-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

import { logoutRequest } from "@/lib/auth.ts";

function useLogout() {
  const { instance } = useMsal();
  const account = useAccount();
  const { location } = useRouterState();
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    await instance.logout({
      ...logoutRequest,
      account,
    });
    await navigate({ from: location.pathname, to: "/" });
  }, [account, instance, location.pathname, navigate]);

  return logout;
}

export default useLogout;
