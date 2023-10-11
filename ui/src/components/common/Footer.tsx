const { VITE_DATAHUB_URL: DATAHUB_URL } = import.meta.env;

export default function Footer() {
  return (
    <footer className="grid h-[128px] flex-none grid-cols-2 items-center bg-gray-1 px-20 py-4 text-white">
      <div className="flex gap-24">
        <div>
          <h6>Giga Links</h6>
          <ul className="indent-4 text-sm">
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
                Giga Map
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
        </div>

        <div>
          <h6>Other Pages</h6>
          <ul className="indent-4 text-sm">
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
        </div>

        <div className="flex flex-col gap-1">
          <h6>Follow us</h6>
          <div className="flex gap-2">
            <a
              href="https://twitter.com/Gigaglobal"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/twitter.svg" alt="Twitter/X" />
            </a>
            <a
              href="https://www.linkedin.com/showcase/gigaglobal"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/linkedin.svg" alt="LinkedIn" />
            </a>
            <a
              href="https://www.instagram.com/giga_global/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/instagram.svg" alt="Instagram" />
            </a>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <img src="/giga-unicef-itu.svg" alt="Giga | UNICEF | ITU" />
      </div>
    </footer>
  );
}
