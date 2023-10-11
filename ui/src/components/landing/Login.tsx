import { useMsal } from "@azure/msal-react";
import { Button } from "antd";

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
    <div className="h-full bg-[url(/home-bg.jpg)] bg-cover text-white">
      <div className="flex h-full w-full flex-col items-center justify-center backdrop-brightness-50">
        <div className="flex flex-col items-center gap-4">
          <Button
            type="primary"
            className="flex h-auto items-center gap-1 border-2 bg-primary px-12 py-4"
            icon={
              <img
                src="/azure.svg"
                alt="Azure AD"
                className="h-[1.5rem] w-auto"
              />
            }
            onClick={handleLogin}
          >
            <h2 className="text-lg">
              <b>Login with Azure AD</b>
            </h2>
          </Button>
        </div>
      </div>
    </div>
  );
}
