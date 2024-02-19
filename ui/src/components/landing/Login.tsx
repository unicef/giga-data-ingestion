import { EventError } from "@azure/msal-browser";
import { useMsal } from "@azure/msal-react";
import { Button } from "@carbon/react";

import loginBg from "@/assets/login-bg.jpeg";
import {
  AAD_B2C_FORGOT_PASSWORD_ERROR,
  apiConfig,
  b2cPolicies,
  loginRequest,
} from "@/lib/auth.ts";

function Login() {
  const { instance } = useMsal();

  async function handleLogin() {
    try {
      await instance.loginPopup(loginRequest);
    } catch (error) {
      const err = error as EventError;
      console.error(err?.message);

      if (err?.message.includes(AAD_B2C_FORGOT_PASSWORD_ERROR)) {
        await instance.loginPopup({
          authority: b2cPolicies.authorities.forgotPassword.authority,
          scopes: apiConfig.b2cScopes,
        });
      }
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
