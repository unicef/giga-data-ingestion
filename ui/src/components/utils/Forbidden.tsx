import { useIsAuthenticated } from "@azure/msal-react";

import Login from "@/components/landing/Login.tsx";

function Forbidden() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <>
      {isAuthenticated ? (
        <div className="flex h-full items-center justify-center gap-4">
          <h2>403</h2>
          <h2 className="border-l border-solid pl-4">Forbidden</h2>
          <p>You do not have permission to access this page.</p>
        </div>
      ) : (
        <Login />
      )}
    </>
  );
}

export default Forbidden;
