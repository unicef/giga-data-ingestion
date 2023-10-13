import { GraphRoleAssignment } from "@/types/role.ts";

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
  app_role_assignments: GraphRoleAssignment[];
}
