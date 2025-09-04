import { PropsWithChildren, useMemo } from "react";

import FullPageLoading from "@/components/landing/FullPageLoading.tsx";
import AuthenticatedView from "@/components/utils/AuthenticatedView.tsx";
import Forbidden from "@/components/utils/Forbidden.tsx";
import useRoles from "@/hooks/useRoles.ts";
import useUser from "@/hooks/useUser";

interface AuthenticatedRBACViewProps extends PropsWithChildren {
  roles?: string[];
}

function AuthenticatedRBACView({
  roles = [],
  children,
}: AuthenticatedRBACViewProps) {
  const { roles: userRoles, isFetching: rolesIsFetching } = useRoles();
  const { enabled, isFetching: userIsFetching } = useUser();

  const hasPermissions = useMemo(() => {
    if (roles.length === 0) {
      return userRoles.length > 0;
    } else {
      return roles.some(role => userRoles.includes(role));
    }
  }, [roles, userRoles]);

  const isFetching = userIsFetching || rolesIsFetching;
  const isEnabledAndHasPermissions = enabled && hasPermissions;

  return (
    <AuthenticatedView>
      {isFetching && <FullPageLoading />}
      {!isFetching && !isEnabledAndHasPermissions && <Forbidden />}
      <div
        style={{
          display:
            isFetching || !isEnabledAndHasPermissions ? "none" : undefined,
        }}
      >
        {children}
      </div>
    </AuthenticatedView>
  );
}

AuthenticatedRBACView.defaultProps = {
  roles: [],
};

export default AuthenticatedRBACView;
