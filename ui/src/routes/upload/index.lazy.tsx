import {
  Accordion,
  AccordionItem,
  Heading,
  Section,
  Stack,
} from "@carbon/react";
import { Link, createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/upload/")({
  component: () => (
    <Section>
      <Section>
        <Stack gap={6}>
          <Heading>What will you be uploading today?</Heading>
          <Accordion>
            <AccordionItem title="A completely new dataset">
              Create a new dataset
            </AccordionItem>
            <AccordionItem title="An addition to an existing dataset">
              <Stack gap={2}>
                <Link
                  to="/upload/$uploadGroup/$uploadType"
                  params={{
                    uploadGroup: "school-data",
                    uploadType: "geolocation",
                  }}
                >
                  School Geolocation
                </Link>
                <Link
                  to="/upload/$uploadGroup/$uploadType"
                  params={{
                    uploadGroup: "school-data",
                    uploadType: "coverage",
                  }}
                >
                  School Coverage
                </Link>
              </Stack>
            </AccordionItem>
          </Accordion>
        </Stack>
      </Section>
    </Section>
  ),
});
