import { GraphGroup } from "@/types/group.ts";

export interface User {
  name: string;
  email: string;
  roles: string[];
}

export interface GraphUser {
  id: string;
  account_enabled: boolean;
  mail: string | null;
  display_name: string | null;
  user_principal_name: string;
  external_user_state: "Accepted" | "PendingAcceptance" | null;
  member_of: GraphGroup[];
}

export const SentinelUser: GraphUser = {
  id: "",
  account_enabled: false,
  mail: null,
  display_name: null,
  user_principal_name: "",
  external_user_state: null,
  member_of: [],
};
