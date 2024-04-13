import { useCallback } from "react";

import { useAccount, useMsal } from "@azure/msal-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

import { logoutRequest } from "@/lib/auth.ts";

function useLogout() {
  const { instance } = useMsal();
  const account = useAccount();
  const { location } = useRouterState();
  const navigate = useNavigate();

  return useCallback(async () => {
    await instance.logout({
      ...logoutRequest,
      account,
    });
    await navigate({
      from: location.pathname,
      to: "/",
      search: {
        page: 1,
        page_size: 10,
      },
    });
  }, [account, instance, location.pathname, navigate]);
}

export default useLogout;
