import { useAuth } from "oidc-react";

import Landing from "@/components/landing/Landing.tsx";
import Login from "@/components/landing/Login.tsx";

function App() {
  const auth = useAuth();

  return auth && auth.userData ? <Landing /> : <Login />;
}

export default App;
