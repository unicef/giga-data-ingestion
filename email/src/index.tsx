import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { render } from "@react-email/render";
import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { secureHeaders } from "hono/secure-headers";

import DataQualityReportUploadSuccess from "./emails/dq-report-upload-success";
import DataQualityReportCheckSuccess from "./emails/dq-report-check-success";
import InviteUser from "./emails/invite-user";
import {
  DataQualityUploadSuccessProps,
  DataQualityUploadSuccessSchema,
  DataQualityCheckSuccessProps,
  DataQualityCheckSuccessSchema,
} from "./types/dq-report";
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
  bearerAuth({ token: process.env.EMAIL_RENDERER_BEARER_TOKEN ?? "" })
);

app.get("/", (ctx) => {
  return ctx.text("ok");
});

app.post("/email/invite-user", zValidator("json", InviteUserProps), (ctx) => {
  const json = ctx.req.valid("json") as InviteUserProps;
  const html = render(<InviteUser {...json} />);
  const text = render(<InviteUser {...json} />, {
    plainText: true,
  });
  return ctx.json({ html, text });
});

app.post(
  "/email/upload_success_email",
  zValidator("json", DataQualityUploadSuccessSchema),
  (ctx) => {
    const json = ctx.req.valid("json") as DataQualityUploadSuccessProps;
    const html = render(<DataQualityReportUploadSuccess {...json} />);
    const text = render(<DataQualityReportUploadSuccess {...json} />, {
      plainText: true,
    });
    return ctx.json({ html, text });
  }
);

app.post(
  "/email/check_success_email",
  zValidator("json", DataQualityCheckSuccessSchema),
  (ctx) => {
    const json = ctx.req.valid("json") as DataQualityCheckSuccessProps;
    const html = render(<DataQualityReportCheckSuccess {...json} />);
    const text = render(<DataQualityReportCheckSuccess {...json} />, {
      plainText: true,
    });
    return ctx.json({ html, text });
  }
);

const port = 3020;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
