export interface User {
  name: string;
  email: string;
  roles: string[];
}

export interface GraphUser {
  id: string;
  mail: string | null;
  display_name: string | null;
  given_name: string | null;
  surname: string | null;
  user_principal_name: string;
}
