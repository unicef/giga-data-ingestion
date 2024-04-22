import { Column, Grid, Stack } from "@carbon/react";

import gigaUnicefItu from "@/assets/giga-unicef-itu.svg";
import instagram from "@/assets/instagram.svg";
import linkedin from "@/assets/linkedin.svg";
import twitter from "@/assets/twitter.svg";

const { VITE_DATAHUB_URL: DATAHUB_URL } = import.meta.env;

export default function Footer() {
  return (
    <Grid
      fullWidth
      className="m-0 items-center bg-giga-black px-0 py-10 text-white"
      as="footer"
    >
      <Column lg={4}>
        <div>
          <img src={gigaUnicefItu} alt="Giga | UNICEF | ITU" />
        </div>
      </Column>

      <Column lg={2}>
        <ul>
          <li>
            <a
              href="https://giga.global"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white"
            >
              Giga Homepage
            </a>
          </li>
          <li>
            <a
              href="https://projectconnect.unicef.org/map"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white"
            >
              Giga Maps
            </a>
          </li>
          <li>
            <a
              href={DATAHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white"
            >
              DataHub
            </a>
          </li>
        </ul>
      </Column>

      <Column lg={2}>
        <ul>
          <li>
            <a
              href="https://projectconnect.unicef.org/map"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white"
            >
              Project Connect
            </a>
          </li>
          <li>
            <a
              href="https://www.patchwork-kingdoms.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white"
            >
              Patchwork Kingdoms
            </a>
          </li>
          <li>
            <a
              href="https://unicef.github.io/mapbox_analysis/story/map"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white"
            >
              Mapbox Data Story
            </a>
          </li>
        </ul>
      </Column>

      <Column lg={8} className="text-right">
        <Stack orientation="horizontal" gap={4}>
          <a
            href="https://twitter.com/Gigaglobal"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={twitter} alt="X (Twitter)" className="w-[24px]" />
          </a>
          <a
            href="https://www.instagram.com/giga_global/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={instagram} alt="Instagram" className="w-[24px]" />
          </a>
          <a
            href="https://www.linkedin.com/showcase/gigaglobal"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={linkedin} alt="LinkedIn" className="w-[24px]" />
          </a>
        </Stack>
        <div>For more information: Giga Sync or tweet us @Gigaglobal</div>
        <div className="text-sm">
          Share your thoughts and suggestions with us on our{" "}
          <a
            className="text-white"
            href="https://github.com/unicef/giga-data-ingestion/issues/new"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub issues page
          </a>
          .
        </div>
      </Column>
    </Grid>
  );
}
