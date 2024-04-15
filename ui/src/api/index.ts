import { PropsWithChildren, useEffect, useRef } from "react";

import { InteractionStatus } from "@azure/msal-browser";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { QueryClient, keepPreviousData } from "@tanstack/react-query";
import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

import useGetToken from "@/hooks/useGetToken.ts";

import approvalRequestsRouter from "./routers/approvalRequests.ts";
import externalRequestsRouter from "./routers/externalRequests.ts";
import rolesRouter from "./routers/groups.ts";
import qosRouter from "./routers/qos.ts";
import schemaRouter from "./routers/schema.ts";
import uploadsRouter from "./routers/uploads.ts";
import usersRouter from "./routers/users.ts";
import utilsRouter from "./routers/utils.ts";

const baseURL = "/api";

export const axi = axios.create({
  baseURL,
  withCredentials: true,
});

export const api = {
  users: usersRouter(axi),
  groups: rolesRouter(axi),
  uploads: uploadsRouter(axi),
  approvalRequests: approvalRequestsRouter(axi),
  qos: qosRouter(axi),
  schema: schemaRouter(axi),
  externalRequests: externalRequestsRouter(),
  utils: utilsRouter(axi),
};

export function useApi() {
  return api;
}

export function AxiosProvider({ children }: PropsWithChildren) {
  const { inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const getToken = useGetToken();

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

  function requestFulFilledInterceptor(config: InternalAxiosRequestConfig) {
    if (isAuthenticated && inProgress === InteractionStatus.None) {
      void getToken();
    }

    return Promise.resolve(config);
  }

  function requestRejectedInterceptor(error: AxiosError) {
    return Promise.reject(error);
  }

  function responseFulFilledInterceptor(response: AxiosResponse) {
    return response;
  }

  function responseRejectedInterceptor(error: AxiosError) {
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

  return children;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      placeholderData: keepPreviousData,
    },
  },
});
