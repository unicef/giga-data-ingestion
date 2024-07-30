import type { AxiosInstance, AxiosResponse } from "axios";

import type { DeleteRowsResponse } from "@/types/delete";

export default function routes(axi: AxiosInstance) {
  return {
    delete_rows: (params: {
      country: string;
      ids: string[];
    }): Promise<AxiosResponse<DeleteRowsResponse>> => {
      return axi.post(`/delete`, {
        country: params.country,
        ids: params.ids,
      });
    },
  };
}
