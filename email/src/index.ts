import { createElement } from "react";

import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { render } from "@react-email/render";
import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { secureHeaders } from "hono/secure-headers";

import DataQualityReport from "./emails/dq-report";
import InviteUser from "./emails/invite-user";
import { DataQualityReportEmailProps } from "./types/dq-report";
import { InviteUserProps } from "./types/invite-user";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NODE_SENTRY_DSN,
    environment: process.env.DEPLOY_ENV ?? "local",
    integrations: [new ProfilingIntegration()],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });
}

const app = new Hono();

app.use("*", secureHeaders());
app.use(
  "/email/*",
  bearerAuth({ token: process.env.EMAIL_RENDERER_BEARER_TOKEN ?? "" }),
);

app.get("/", ctx => {
  return ctx.text("ok");
});

app.post("/email/invite-user", zValidator("json", InviteUserProps), ctx => {
  const json = ctx.req.valid("json") as InviteUserProps;
  const html = render(createElement(InviteUser, json, null));
  const text = render(createElement(InviteUser, json, null), {
    plainText: true,
  });
  return ctx.json({ html, text });
});

app.post(
  "/email/dq-report",
  zValidator("json", DataQualityReportEmailProps),
  ctx => {
    const json = ctx.req.valid("json") as DataQualityReportEmailProps;
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
