import { Helmet } from "react-helmet-async";
import { Outlet } from "react-router-dom";

import Footer from "@/components/common/Footer";
import Navbar from "@/components/common/Navbar.tsx";
import info from "@/info.json";

export default function Layout() {
  return (
    <div className="flex h-screen min-h-screen flex-col">
      <Helmet>
        <title>{info.title}</title>
        <meta name="description" content={info.description} />
      </Helmet>
      <Navbar />
      <main className="flex-auto">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
