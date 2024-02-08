import { createElement } from "react";

import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { render } from "@react-email/render";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { secureHeaders } from "hono/secure-headers";

import DataQualityReport from "../emails/dq-report";
import { DataQualityReportEmailProps } from "../types/dq-report";

const app = new Hono();

app.use("*", secureHeaders());
app.use("/email/*", bearerAuth({ token: process.env.BEARER_TOKEN ?? "" }));

app.get("/", ctx => {
  return ctx.text("ok");
});

app.post(
  "/email/dq-report",
  zValidator("json", DataQualityReportEmailProps),
  ctx => {
    const json = ctx.req.valid("json");
    const html = render(createElement(DataQualityReport, json, null));
    const text = render(createElement(DataQualityReport, json, null), {
      plainText: true,
    });
    return ctx.json({ html, text });
  },
);

const port = 3020;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
