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
    get_groups_from_email: (): Promise<AxiosResponse<GraphUser>> => {
      return axi.get("/users/email");
    },

    invite_and_add_groups: ({
      groups_to_add,
      invited_user_display_name,
      invited_user_email_address,
      invited_user_given_name,
      invited_user_surname,
    }: {
      groups_to_add: string[];
      invited_user_display_name: string;
      invited_user_email_address: string;
      invited_user_given_name: string;
      invited_user_surname: string;
    }): Promise<AxiosResponse<null>> => {
      return axi.post(`/users/invite_and_add_groups`, {
        groups_to_add: groups_to_add,
        invited_user_display_name: invited_user_display_name,
        invited_user_email_address: invited_user_email_address,
        invited_user_given_name: invited_user_given_name,
        invited_user_surname: invited_user_surname,
      });
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
      return axi.patch(`/users/${id}`, {
        account_enabled,
        display_name,
      });
    },
  };
}
