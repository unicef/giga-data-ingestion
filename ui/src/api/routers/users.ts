import { AxiosInstance, AxiosResponse } from "axios";

import { GraphUser } from "@/types/user.ts";

export default function routes(axi: AxiosInstance) {
  return {
    list: (): Promise<AxiosResponse<GraphUser[]>> => {
      return axi.get("/users");
    },
    get: (id: string): Promise<AxiosResponse<GraphUser>> => {
      return axi.get(`/users/${id}`);
    },
  };
}
