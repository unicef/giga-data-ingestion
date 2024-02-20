import { useMsal } from "@azure/msal-react";
import { Button } from "@carbon/react";

import loginBg from "@/assets/login-bg.jpeg";
import { loginRequest } from "@/lib/auth.ts";

function Login() {
  const { instance } = useMsal();

  async function handleLogin() {
    try {
      await instance.loginPopup(loginRequest);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div
      className="h-full bg-cover text-white"
      style={{
        backgroundImage: `url('${loginBg}')`,
      }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center backdrop-brightness-50">
        <Button onClick={handleLogin}>Login</Button>
      </div>
    </div>
  );
}

export default Login;
