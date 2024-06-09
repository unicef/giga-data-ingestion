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
import deleteRouter from "./routers/delete.ts";
import externalRequestsRouter from "./routers/externalRequests.ts";
import groupsRouter from "./routers/groups.ts";
import qosRouter from "./routers/qos.ts";
import rolesRouter from "./routers/roles.ts";
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
  approvalRequests: approvalRequestsRouter(axi),
  delete: deleteRouter(axi),
  externalRequests: externalRequestsRouter(),
  groups: groupsRouter(axi),
  roles: rolesRouter(axi),
  qos: qosRouter(axi),
  schema: schemaRouter(axi),
  uploads: uploadsRouter(axi),
  users: usersRouter(axi),
  utils: utilsRouter(axi),
};

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

  async function requestFulFilledInterceptor(
    config: InternalAxiosRequestConfig,
  ) {
    if (!isAuthenticated && inProgress === InteractionStatus.Startup) {
      try {
        const { accessToken } = await getToken();
        config.headers["Authorization"] = `Bearer ${accessToken}`;
        return Promise.resolve(config);
      } catch (err) {
        console.error(err);
        return Promise.resolve(config);
      }
    }

    return Promise.resolve(config);
  }

  function requestRejectedInterceptor(error: AxiosError) {
    return Promise.reject(error);
  }

  function responseFulFilledInterceptor(response: AxiosResponse) {
    return response;
  }

  async function responseRejectedInterceptor(error: AxiosError) {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      inProgress !== InteractionStatus.None
    ) {
      try {
        const { accessToken } = await getToken();

        try {
          const res = await axi.request({
            ...originalRequest,
            headers: {
              ...originalRequest.headers,
              Authorization: `Bearer ${accessToken}`,
            },
          });
          return Promise.resolve(res);
        } catch (e) {
          console.error(e);
          return Promise.reject(e);
        }
      } catch (e) {
        console.error(e);
        return Promise.resolve(error);
      }
    }

    console.error(error);
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
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      placeholderData: keepPreviousData,
    },
    mutations: {
      retry: false,
    },
  },
});
