import { Link } from "react-router-dom";

import {
  Accordion,
  AccordionItem,
  Heading,
  Section,
  Stack,
} from "@carbon/react";

export default function UploadDataSelect() {
  return (
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
                <Link to="school-data/geolocation" unstable_viewTransition>
                  School Geolocation
                </Link>
                <Link to="school-data/geolocation" unstable_viewTransition>
                  School Coverage
                </Link>
              </Stack>
            </AccordionItem>
          </Accordion>
        </Stack>
      </Section>
    </Section>
  );
}
