import { type PropsWithChildren, useMemo } from "react";

import AuthenticatedView from "@/components/utils/AuthenticatedView.tsx";
import Forbidden from "@/components/utils/Forbidden.tsx";
import useRoles from "@/hooks/useRoles.ts";

interface AuthenticatedRBACViewProps extends PropsWithChildren {
  roles?: string[];
}

function AuthenticatedRBACView({ roles = [], children }: AuthenticatedRBACViewProps) {
  const { roles: userRoles } = useRoles();

  const hasPermissions = useMemo(() => {
    if (roles.length === 0) {
      return userRoles.length > 0;
    }
    return roles.some(role => userRoles.includes(role));
  }, [roles, userRoles]);

  return (
    <AuthenticatedView>{hasPermissions ? children : <Forbidden />}</AuthenticatedView>
  );
}

AuthenticatedRBACView.defaultProps = {
  roles: [],
};

export default AuthenticatedRBACView;
