import { useAuth } from "oidc-react";

import Landing from "@/components/landing/Landing.tsx";
import Login from "@/components/landing/Login.tsx";

function App() {
  const auth = useAuth();
  console.debug("hello", auth);

  return auth && auth.userData ? <Landing /> : <Login />;
}

export default App;
