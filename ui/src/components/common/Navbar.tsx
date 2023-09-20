import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="flex-none">
      <nav className="bg-primary flex h-[80px] items-center justify-between p-4 text-white">
        <Link to="/" className="flex items-center gap-2">
          <img src="/GIGA_logo.png" alt="Giga" />
          <h1 className="text-2xl text-white">
            <b>giga ingest</b>
          </h1>
        </Link>
      </nav>
    </header>
  );
}
