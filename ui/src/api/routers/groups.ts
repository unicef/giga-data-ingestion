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
    create: ({
      description = "",
      display_name,
    }: {
      description?: string;
      display_name: string;
    }): Promise<AxiosResponse<GraphGroup>> => {
      return axi.post(`/groups`, {
        description: description,
        display_names: display_name,
      });
    },
    add_user_to_group: ({
      id,
      user_id,
    }: {
      id: string;
      user_id: string;
    }): Promise<AxiosResponse<null>> => {
      return axi.post(`/groups/${id}/users`, {
        user_id: user_id,
      });
    },
    remove_user_from_group: ({
      group_id,
      user_id,
    }: {
      group_id: string;
      user_id: string;
    }): Promise<AxiosResponse<null>> => {
      return axi.delete(`/groups/${group_id}/users/${user_id}`);
    },
  };
}
