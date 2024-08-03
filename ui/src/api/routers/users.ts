import { AxiosInstance, AxiosResponse } from "axios";

import {
  CreateUserRequest,
  DatabaseUser,
  DatabaseUserWithRoles,
} from "@/types/user.ts";

export default function routes(axi: AxiosInstance) {
  return {
    list: (): Promise<AxiosResponse<DatabaseUserWithRoles[]>> => {
      return axi.get("/users");
    },
    get: (id: string): Promise<AxiosResponse<DatabaseUserWithRoles>> => {
      return axi.get(`/users/${id}`);
    },
    getCurrentUser: (): Promise<AxiosResponse<DatabaseUser>> => {
      return axi.get(`/users/me`);
    },
    create: (body: CreateUserRequest): Promise<AxiosResponse<DatabaseUser>> => {
      return axi.post("/users", body);
    },
    edit: ({
      enabled,
      display_name,
      id,
    }: {
      enabled?: boolean;
      display_name?: string;
      id: string;
    }): Promise<AxiosResponse<null>> => {
      return axi.patch(`/users/${id}`, {
        enabled,
        display_name,
      });
    },
  };
}
