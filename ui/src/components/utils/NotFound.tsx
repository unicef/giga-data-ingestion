import { useIsAuthenticated } from "@azure/msal-react";

import Login from "@/components/landing/Login.tsx";

function NotFound() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <>
      {isAuthenticated ? (
        <div className="flex h-full items-center justify-center gap-4">
          <h2>404</h2>
          <h2 className="border-l border-solid pl-4">Not Found</h2>
        </div>
      ) : (
        <Login />
      )}
    </>
  );
}

export default NotFound;
