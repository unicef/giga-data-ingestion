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
    edit_user: ({
      account_enabled,
      display_name,
      id,
    }: {
      account_enabled?: boolean;
      display_name?: string;
      id: string;
    }): Promise<AxiosResponse<null>> => {
      return axi.patch(`users/${id}`, {
        account_enabled,
        display_name,
      });
    },
  };
}
