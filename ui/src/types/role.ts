export interface GraphRole {
  id: string;
  description: string;
  display_name: string;
  value: string;
}

export interface GraphRoleAssignment {
  id: string;
  app_role_id: string;
}
