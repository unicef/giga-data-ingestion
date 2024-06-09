import { PropsWithChildren, useMemo } from "react";

import FullPageLoading from "@/components/landing/FullPageLoading.tsx";
import AuthenticatedView from "@/components/utils/AuthenticatedView.tsx";
import Forbidden from "@/components/utils/Forbidden.tsx";
import useRoles from "@/hooks/useRoles.ts";

interface AuthenticatedRBACViewProps extends PropsWithChildren {
  roles?: string[];
}

function AuthenticatedRBACView({
  roles = [],
  children,
}: AuthenticatedRBACViewProps) {
  const { roles: userRoles, isFetching } = useRoles();

  const hasPermissions = useMemo(() => {
    if (roles.length === 0) {
      return userRoles.length > 0;
    } else {
      return roles.some(role => userRoles.includes(role));
    }
  }, [roles, userRoles]);

  return (
    <AuthenticatedView>
      {isFetching ? (
        <FullPageLoading />
      ) : hasPermissions ? (
        children
      ) : (
        <Forbidden />
      )}
    </AuthenticatedView>
  );
}

AuthenticatedRBACView.defaultProps = {
  roles: [],
};

export default AuthenticatedRBACView;
