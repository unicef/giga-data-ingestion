import { ArrowRight, DocumentAdd } from "@carbon/icons-react";
import { Button, Column, Grid, Heading } from "@carbon/react";
import { Link } from "@tanstack/react-router";

export default function Landing() {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-6">
      <Grid>
        <Column lg={16}>
          <Heading>
            giga<b>sync</b>
          </Heading>
          <p className="text-2xl">
            Upload and view quality datasets to help connect every school to the
            internet.
          </p>
        </Column>
      </Grid>

      <Grid>
        <Column lg={4}>
          <div className="flex-col gap-4 bg-giga-light-gray p-4 text-black hover:bg-giga-light-gray hover:text-black">
            <div className="text-xl">Upload data file</div>
            <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit</div>
            <DocumentAdd size={60} />
          </div>
        </Column>
        <Column lg={4}>
          <div className="flex-col gap-4 bg-giga-light-gray p-4 text-black hover:bg-giga-light-gray hover:text-black">
            <div className="text-xl">Configure API</div>
            <div>
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua
            </div>
            <DocumentAdd size={60} />
          </div>
        </Column>
        <Column lg={4}>
          <div className="flex-col gap-4 bg-giga-light-gray p-4 text-black hover:bg-giga-light-gray hover:text-black">
            <div className="text-xl">Check data quality</div>
            <div>
              Ut enim ad minim veniam, quis nostrud exercitation ullamco
            </div>
            <DocumentAdd size={60} />
          </div>
        </Column>
      </Grid>

      <Grid>
        <Column lg={4}>
          <Button className="w-full" renderIcon={ArrowRight}>
            Log in
          </Button>
          <div>
            Login lorem ipsum{" "}
            <Link to="/">
              <u>Dolor sit Amet</u>
            </Link>
          </div>
        </Column>
      </Grid>
    </div>
  );
}
