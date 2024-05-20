import { AxiosInstance, AxiosResponse } from "axios";

import { MetaSchema } from "@/types/schema.ts";

export default function routes(axi: AxiosInstance) {
  return {
    get: (
      name: string,
      is_qos = false,
    ): Promise<AxiosResponse<MetaSchema[]>> => {
      return axi.get(`/schema/${name}`, {
        params: { is_qos },
      });
    },
    download: (name: string): Promise<AxiosResponse<Blob>> => {
      return axi.get(`/schema/${name}/download`, {
        responseType: "blob",
      });
    },
  };
}
