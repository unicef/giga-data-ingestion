import { Link } from "react-router-dom";

import { Accordion, AccordionItem, Heading, Section } from "@carbon/react";

export default function UploadDataSelect() {
  return (
    <Section>
      <Heading>What will you be uploading today?</Heading>
      <Section>
        <Accordion>
          <AccordionItem title="A completely new dataset">
            Create a new dataset
          </AccordionItem>
          <AccordionItem title="An addition to an existing dataset">
            <ul>
              <li>
                <Link to="school-data/geolocation" unstable_viewTransition>
                  School Geolocation
                </Link>
              </li>
              <li>
                <Link to="school-data/geolocation" unstable_viewTransition>
                  School Coverage
                </Link>
              </li>
            </ul>
          </AccordionItem>
        </Accordion>
      </Section>
    </Section>
  );
}
