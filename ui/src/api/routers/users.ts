import { AxiosInstance, AxiosResponse } from "axios";

import { GraphUserWithRoles } from "@/types/user.ts";

export default function routes(axi: AxiosInstance) {
  return {
    list: (): Promise<AxiosResponse<GraphUserWithRoles[]>> => {
      return axi.get("/users");
    },
    get: (id: string): Promise<AxiosResponse<GraphUserWithRoles>> => {
      return axi.get(`/users/${id}`);
    },
  };
}
