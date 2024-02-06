import { PropsWithChildren, useEffect, useRef } from "react";

import { InteractionStatus } from "@azure/msal-browser";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { QueryClient } from "@tanstack/react-query";
import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

import { loginRequest } from "@/lib/auth.ts";
import { useStore } from "@/store.ts";

import rolesRouter from "./routers/groups.ts";
import uploadsRouter from "./routers/uploads.ts";
import usersRouter from "./routers/users.ts";

const baseURL = "/api";

export const axi = axios.create({
  baseURL,
  withCredentials: true,
});

const api = {
  users: usersRouter(axi),
  groups: rolesRouter(axi),
  uploads: uploadsRouter(axi),
};

export function useApi() {
  return api;
}

export function AxiosProvider(props: PropsWithChildren) {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const { setFullPageLoading } = useStore();
  const reqInterceptId = useRef(
    axi.interceptors.request.use(
      requestFulFilledInterceptor,
      requestRejectedInterceptor,
    ),
  );
  const resInterceptId = useRef(
    axi.interceptors.response.use(
      responseFulFilledInterceptor,
      responseRejectedInterceptor,
    ),
  );

  async function requestFulFilledInterceptor(
    config: InternalAxiosRequestConfig,
  ) {
    setFullPageLoading(true);

    if (isAuthenticated && inProgress === InteractionStatus.None) {
      try {
        const result = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        });
        axi.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${result.accessToken}`;
      } catch (error) {
        return Promise.reject(error);
      }
    }

    return Promise.resolve(config);
  }

  function requestRejectedInterceptor(error: AxiosError) {
    return Promise.reject(error);
  }

  function responseFulFilledInterceptor(response: AxiosResponse) {
    setFullPageLoading(false);
    return response;
  }

  function responseRejectedInterceptor(error: AxiosError) {
    setFullPageLoading(false);
    return Promise.reject(error);
  }

  useEffect(() => {
    const reqIntId = reqInterceptId.current;
    const resIntId = resInterceptId.current;

    return () => {
      if (reqIntId) axi.interceptors.request.eject(reqIntId);
      if (resIntId) axi.interceptors.response.eject(resIntId);

      delete axi.defaults.headers.common["Authorization"];
    };
  }, []);

  return props.children;
}

export const queryClient = new QueryClient();
