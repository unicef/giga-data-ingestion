import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { render } from "@react-email/render";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { logger } from "hono/logger";
import { sentry } from '@hono/sentry';
import { secureHeaders } from "hono/secure-headers";
import { hostname } from "os";

import DataQualityReportUploadSuccess from "./emails/dq-report-upload-success";
import DataQualityReportCheckSuccess from "./emails/dq-report-check-success";
import DataQualityReport from "./emails/dq-report";
import DqReportPDF from "./emails/dq-report-pdf";
import DqReportDetailedPDF from "./emails/dq-report-detailed-pdf";
import MasterDataReleaseNotification from "./emails/master-data-release-notification";
import InviteUser from "./emails/invite-user";
import {
  DataQualityUploadSuccessProps,
  DataQualityCheckSuccessProps,
  DataQualityReportEmailProps,
} from "./types/dq-report";
import { InviteUserProps } from "./types/invite-user";
import { MasterDataReleaseNotificationProps } from "./types/master-data-release-notification";
import { generatePDFBase64 } from "./lib/pdf-generator";

const app = new Hono();

app.use("*", secureHeaders());
if (process.env.NODE_SENTRY_DSN && process.env.NODE_ENV !== "development") {
  app.use("*", sentry({
    dsn: process.env.NODE_SENTRY_DSN,
    environment: process.env.DEPLOY_ENV ?? "local",
    serverName: `ingestion-portal-email-${process.env.DEPLOY_ENV}@${hostname()}`,
    integrations: [nodeProfilingIntegration()],
    release: `github.com/unicef/giga-data-ingestion:${process.env.COMMIT_SHA}`,
    sampleRate: 1.0,
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  } as any));
}
app.use(logger());
app.use(
  "/email/*",
  bearerAuth({ token: process.env.EMAIL_RENDERER_BEARER_TOKEN ?? "" }),
);

app.get("/", async (ctx) => {
  return ctx.text("ok");
});

app.post(
  "/email/invite-user",
  zValidator("json", InviteUserProps),
  async (ctx) => {
    const json = ctx.req.valid("json") as InviteUserProps;
    const html = await render(<InviteUser {...json} />);
    const text = await render(<InviteUser {...json} />, {
      plainText: true,
    });
    return ctx.json({ html, text });
  },
);

app.post(
  "/email/dq-report-upload-success",
  zValidator("json", DataQualityUploadSuccessProps),
  async (ctx) => {
    const json = ctx.req.valid("json") as DataQualityUploadSuccessProps;
    const html = await render(<DataQualityReportUploadSuccess {...json} />);
    const text = await render(<DataQualityReportUploadSuccess {...json} />, {
      plainText: true,
    });
    return ctx.json({ html, text });
  },
);

app.post(
  "/email/dq-report-check-success",
  zValidator("json", DataQualityCheckSuccessProps),
  async (ctx) => {
    const json = ctx.req.valid("json") as DataQualityCheckSuccessProps;
    const html = await render(<DataQualityReportCheckSuccess {...json} />);
    const text = await render(<DataQualityReportCheckSuccess {...json} />, {
      plainText: true,
    });
    
    // Generate PDF for DQ check results (optional, can be enabled if needed)
    // For now, only sending PDF with full DQ reports that have errors
    return ctx.json({ html, text, pdf: null });
  },
);

app.post(
  "/email/dq-report",
  zValidator("json", DataQualityReportEmailProps),
  async (ctx) => {
    const json = ctx.req.valid("json") as DataQualityReportEmailProps;
    const html = await render(<DataQualityReport {...json} />);
    const text = await render(<DataQualityReport {...json} />, {
      plainText: true,
    });
    
    // Generate PDF attachment
    let pdfBase64 = null;
    try {
      pdfBase64 = await generatePDFBase64(<DqReportDetailedPDF {...json} />);
      console.log("PDF generated successfully");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      // Continue without PDF if generation fails
    }
    
    return ctx.json({ html, text, pdf: pdfBase64 });
  },
);

app.post(
  "/email/master-data-release-notification",
  zValidator("json", MasterDataReleaseNotificationProps),
  async (ctx) => {
    const json = ctx.req.valid("json") as MasterDataReleaseNotificationProps;
    const html = await render(<MasterDataReleaseNotification {...json} />);
    const text = await render(<MasterDataReleaseNotification {...json} />, {
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
