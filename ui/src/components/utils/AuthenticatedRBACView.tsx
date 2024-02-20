import { PropsWithChildren, useMemo } from "react";

import { useAccount } from "@azure/msal-react";

import AuthenticatedView from "@/components/utils/AuthenticatedView.tsx";
import Forbidden from "@/components/utils/Forbidden.tsx";

interface AuthenticatedRBACViewProps extends PropsWithChildren {
  roles: string[];
}

function AuthenticatedRBACView({
  roles = [],
  children,
}: AuthenticatedRBACViewProps) {
  const idTokenClaims = useAccount()?.idTokenClaims ?? {};

  const hasPermissions = useMemo(() => {
    const groups = (idTokenClaims.groups ?? []) as string[];

    if (roles.length === 0) {
      return groups.length > 0;
    } else {
      return roles.some(role => groups.includes(role));
    }
  }, [idTokenClaims.groups, roles]);

  return (
    <AuthenticatedView>
      {hasPermissions ? children : <Forbidden />}
    </AuthenticatedView>
  );
}

AuthenticatedRBACView.defaultProps = {
  roles: [],
};

export default AuthenticatedRBACView;
