import { useEffect } from "react";

import { InteractionStatus } from "@azure/msal-browser";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { QueryClient } from "@tanstack/react-query";
import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";

import { loginRequest } from "@/lib/auth.ts";

import rolesRouter from "./routers/groups.ts";
import uploadsRouter from "./routers/uploads.ts";
import usersRouter from "./routers/users.ts";

const baseURL = "/api";

export const axi = axios.create({
  baseURL,
  withCredentials: true,
});

const api = {
  health: (): Promise<AxiosResponse<string>> => {
    return axi.get("");
  },
  users: usersRouter(axi),
  groups: rolesRouter(axi),
  uploads: uploadsRouter(axi),
};

export function useApi() {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    async function onRequestFulfilled(
      config: InternalAxiosRequestConfig,
    ): Promise<InternalAxiosRequestConfig> {
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

    const resId = axi.interceptors.request.use(
      onRequestFulfilled,
      error => error,
    );

    return () => {
      axi.interceptors.request.eject(resId);
      delete axi.defaults.headers.common["Authorization"];
    };
  }, [accounts, inProgress, isAuthenticated, instance]);

  return api;
}

export const queryClient = new QueryClient();
