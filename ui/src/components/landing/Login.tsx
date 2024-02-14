import { useMsal } from "@azure/msal-react";
import { Button } from "@carbon/react";

import loginBg from "@/assets/login-bg.jpeg";
import { loginRequest } from "@/lib/auth.ts";

export default function Login() {
  const { instance } = useMsal();

  async function handleLogin() {
    try {
      await instance.loginPopup(loginRequest);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className={`h-full bg-[url(${loginBg})] bg-cover text-white`}>
      <div className="flex h-full w-full flex-col items-center justify-center backdrop-brightness-50">
        <div className="flex flex-col items-center gap-4">
          <Button className="flex items-center gap-4" onClick={handleLogin}>
            Login with Azure AD
          </Button>
        </div>
      </div>
    </div>
  );
}
