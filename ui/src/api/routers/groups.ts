import { AxiosInstance, AxiosResponse } from "axios";

import { GraphGroup } from "@/types/group.ts";
import { GraphUser } from "@/types/user.ts";

export default function routes(axi: AxiosInstance) {
  return {
    list: (): Promise<AxiosResponse<GraphGroup[]>> => {
      return axi.get("/groups");
    },
    list_users_in_group: (
      groupId: string,
    ): Promise<AxiosResponse<GraphUser[]>> => {
      return axi.get(`/groups/${groupId}/users`);
    },
    get: (id: string): Promise<AxiosResponse<GraphGroup>> => {
      return axi.get(`/groups/${id}`);
    },
  };
}
