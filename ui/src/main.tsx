import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";

import "@fontsource/open-sans/300.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/500.css";
import "@fontsource/open-sans/600.css";
import "@fontsource/open-sans/700.css";
import { Routes } from "@generouted/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { App as AntDApp, ConfigProvider as AntDConfigProvider } from "antd";

import { queryClient } from "@/api";
import "@/styles/index.css";
import theme from "@/styles/theme.ts";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AntDConfigProvider theme={theme}>
        <AntDApp>
          <HelmetProvider>
            <Routes />
          </HelmetProvider>
        </AntDApp>
      </AntDConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
