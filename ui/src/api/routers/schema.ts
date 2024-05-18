import { AxiosInstance, AxiosResponse } from "axios";

import { MetaSchema } from "@/types/schema.ts";

export default function routes(axi: AxiosInstance) {
  return {
    get: (name: string): Promise<AxiosResponse<MetaSchema[]>> => {
      return axi.get(`/schema/${name}`);
    },
    download: (name: string): Promise<AxiosResponse<Blob>> => {
      return axi.get(`/schema/${name}/download`, {
        responseType: "blob",
      });
    },
  };
}
