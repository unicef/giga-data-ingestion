import { useMsal } from "@azure/msal-react";
import { ArrowRight, DocumentAdd } from "@carbon/icons-react";
import { Button, Heading } from "@carbon/react";

import { loginRequest } from "@/lib/auth.ts";

const cards: { title: string; description: React.ReactNode }[] = [
  {
    title: "Upload data file",
    description: (
      <>
        <p className="cds--label-description">
          Contribute to Project Giga by uploading your data directly.
        </p>
        <p className="cds--label">
          Accepted formats include: [.csv, .xls, .xlsx, etc. ]
        </p>
      </>
    ),
  },
  {
    title: "Configure API",
    description: (
      <p className="cds--label-description">
        Integrate your data using our Ingest API and send data directly to Project Giga.
      </p>
    ),
  },
  {
    title: "Check data quality",
    description: (
      <p className="cds--label-description">
        Over 150 data validation checks are performed on ingest before data is added to
        the platform in order to ensure all data meets the standards required.
      </p>
    ),
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
          <div
            key={card.title}
            className="flex flex-col justify-between gap-4 bg-giga-light-gray p-4 text-black hover:bg-giga-light-gray hover:text-black"
          >
            <div className="flex flex-col gap-4">
              <div className="text-2xl font-semibold">{card.title}</div>
              <div>{card.description}</div>
            </div>
            <DocumentAdd size={60} className="text-giga-dark-gray" />
          </div>
        ))}
      </div>

      <div />

      <Button
        className="w-full"
        renderIcon={ArrowRight}
        onClick={handleLogin}
        isExpressive
      >
        Log in
      </Button>
    </div>
  );
}

export default Login;
