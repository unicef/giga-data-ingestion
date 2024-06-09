import { AxiosInstance, AxiosResponse } from "axios";

import { DatabaseRole } from "@/types/group.ts";

export default function routes(axi: AxiosInstance) {
  return {
    getForCurrentUser: (): Promise<AxiosResponse<string[]>> => {
      return axi.get("/roles/me");
    },
    list: (): Promise<AxiosResponse<DatabaseRole[]>> => {
      return axi.get("/roles");
    },
  };
}
