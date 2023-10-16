import { GraphRole, GraphRoleAssignment } from "@/types/role.ts";

export interface User {
  name: string;
  email: string;
  roles: string[];
}

export interface BaseGraphUser {
  id: string;
  account_enabled: boolean;
  mail: string | null;
  display_name: string | null;
  user_principal_name: string;
}

export interface GraphUser extends BaseGraphUser {
  app_role_assignments: GraphRoleAssignment[];
}

export interface GraphUserWithRoles extends BaseGraphUser {
  app_role_assignments: GraphRole[];
}
