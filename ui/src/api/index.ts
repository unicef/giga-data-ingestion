import { QueryClient } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";

import rolesRouter from "./routers/roles.ts";
import usersRouter from "./routers/users.ts";

const baseURL = "/api";

export const axi = axios.create({
  baseURL,
  withCredentials: true,
});

export const api = {
  health: (): Promise<AxiosResponse<string>> => {
    return axi.get("");
  },
  users: usersRouter(axi),
  roles: rolesRouter(axi),
};

export const queryClient = new QueryClient();
