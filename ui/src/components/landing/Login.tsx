import { useMsal } from "@azure/msal-react";
import { ArrowRight, DocumentAdd } from "@carbon/icons-react";
import { Button, Heading } from "@carbon/react";
import { Link } from "@tanstack/react-router";

import { loginRequest } from "@/lib/auth.ts";

const cards: { title: string; description: string }[] = [
  {
    title: "Upload data file",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
  },
  {
    title: "Configure API",
    description:
      "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
  },
  {
    title: "Check data quality",
    description: "Ut enim ad minim veniam, quis nostrud exercitation ullamco",
  },
];

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
    <div className="container flex h-full w-full flex-col justify-center gap-6">
      <div>
        <div>
          <Heading>
            giga<b>sync</b>
          </Heading>
          <p className="text-2xl">
            Upload and view quality datasets to help connect every school to the
            internet.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {cards.map(card => (
          <div className="flex flex-col gap-4 bg-giga-light-gray p-4 text-black hover:bg-giga-light-gray hover:text-black">
            <div className="text-2xl font-semibold">{card.title}</div>
            <div>{card.description}</div>
            <DocumentAdd size={60} className="text-giga-dark-gray" />
          </div>
        ))}
      </div>

      <div />

      <div className="flex flex-col gap-2">
        <Button
          className="w-full"
          renderIcon={ArrowRight}
          onClick={handleLogin}
          isExpressive
        >
          Log in
        </Button>
        <div>
          Login lorem ipsum{" "}
          <Link to="/">
            <u>Dolor sit Amet</u>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
