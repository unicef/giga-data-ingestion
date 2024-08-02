import { DatabaseRole, GraphGroup } from "@/types/group.ts";

export interface User {
  name: string;
  email: string;
  roles: string[];
}

export interface GraphUser {
  account_enabled: boolean;
  display_name: string | null;
  given_name: string;
  id: string;
  surname: string;
  mail: string;
  user_principal_name: string;
  external_user_state: "Accepted" | "PendingAcceptance" | null;
  member_of: GraphGroup[];
}

export interface CreateUserRequest {
  given_name: string;
  surname: string;
  email: string;
  roles: DatabaseRole[];
}

export interface DatabaseUser {
  given_name: string;
  surname: string;
  email: string;
  id: string;
  enabled: boolean;
}

export interface DatabaseUserWithRoles extends DatabaseUser {
  roles: DatabaseRole[];
}
