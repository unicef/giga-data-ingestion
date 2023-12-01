import { QueryClient } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";

import rolesRouter from "./routers/groups.ts";
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
};

export function useApi() {
  return api;
}

export const queryClient = new QueryClient();
