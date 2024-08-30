import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { render } from "@react-email/render";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { secureHeaders } from "hono/secure-headers";
import { hostname } from "os";

import DataQualityReportUploadSuccess from "./emails/dq-report-upload-success";
import DataQualityReportCheckSuccess from "./emails/dq-report-check-success";
import DataQualityReport from "./emails/dq-report";
import MasterDataReleaseNotification from "./emails/master-data-release-notification";
import InviteUser from "./emails/invite-user";
import {
  DataQualityUploadSuccessProps,
  DataQualityCheckSuccessProps,
  DataQualityReportEmailProps,
} from "./types/dq-report";
import { InviteUserProps } from "./types/invite-user";
import { MasterDataReleaseNotificationProps } from "./types/master-data-release-notification";

if (process.env.SENTRY_DSN && process.env.NODE_ENV !== "development") {
  Sentry.init({
    dsn: process.env.NODE_SENTRY_DSN,
    environment: process.env.DEPLOY_ENV ?? "local",
    serverName: `ingestion-portal-email-${process.env.DEPLOY_ENV}@${hostname()}`,
    integrations: [nodeProfilingIntegration()],
    release: `github.com/unicef/giga-data-ingestion:${process.env.COMMIT_SHA}`,
    sampleRate: 1.0,
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
  "/email/dq-report-upload-success",
  zValidator("json", DataQualityUploadSuccessProps),
  (ctx) => {
    const json = ctx.req.valid("json") as DataQualityUploadSuccessProps;
    const html = render(<DataQualityReportUploadSuccess {...json} />);
    const text = render(<DataQualityReportUploadSuccess {...json} />, {
      plainText: true,
    });
    return ctx.json({ html, text });
  },
);

app.post(
  "/email/dq-report-check-success",
  zValidator("json", DataQualityCheckSuccessProps),
  (ctx) => {
    const json = ctx.req.valid("json") as DataQualityCheckSuccessProps;
    const html = render(<DataQualityReportCheckSuccess {...json} />);
    const text = render(<DataQualityReportCheckSuccess {...json} />, {
      plainText: true,
    });
    return ctx.json({ html, text });
  },
);

app.post(
  "/email/dq-report",
  zValidator("json", DataQualityReportEmailProps),
  (ctx) => {
    const json = ctx.req.valid("json") as DataQualityReportEmailProps;
    const html = render(<DataQualityReport {...json} />);
    const text = render(<DataQualityReport {...json} />, {
      plainText: true,
    });
    return ctx.json({ html, text });
  },
);

app.post(
  "/email/master-data-release-notification",
  zValidator("json", MasterDataReleaseNotificationProps),
  (ctx) => {
    const json = ctx.req.valid("json") as MasterDataReleaseNotificationProps;
    const html = render(<MasterDataReleaseNotification {...json} />);
    const text = render(<MasterDataReleaseNotification {...json} />, {
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
