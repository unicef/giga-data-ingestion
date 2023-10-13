import { AxiosInstance, AxiosResponse } from "axios";

import { GraphRole } from "@/types/role.ts";

export default function routes(axi: AxiosInstance) {
  return {
    list: (): Promise<AxiosResponse<GraphRole[]>> => {
      return axi.get("/roles");
    },
  };
}
