import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { render } from "@react-email/render";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { logger } from "hono/logger";
import { sentry } from '@hono/sentry';
import { secureHeaders } from "hono/secure-headers";
// import { hostname } from "os";

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
import { PDFGenerator } from "./lib/pdf-generator";

const app = new Hono();

app.use("*", secureHeaders());
if (process.env.NODE_SENTRY_DSN && process.env.NODE_ENV !== "development") {
  app.use("*", sentry({
    dsn: process.env.NODE_SENTRY_DSN,
    environment: process.env.DEPLOY_ENV ?? "local",
    // integrations: [nodeProfilingIntegration()],
    release: `github.com/unicef/giga-data-ingestion:${process.env.COMMIT_SHA}`,
    sampleRate: 1.0,
    tracesSampleRate: 1.0,
  }));
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
    return ctx.json({ html, text });
  },
);

app.post(
  "/email/dq-report",
  zValidator("json", DataQualityReportEmailProps),
  async (ctx) => {
    const json = ctx.req.valid("json") as DataQualityReportEmailProps;
    
    // Generate PDF attachment if data quality check is available
    let pdfAttachment = null;
    if (json.dataQualityCheck) {
      try {
        const pdfGenerator = new PDFGenerator();
        const pdfData = {
          country: json.country,
          dataset: json.dataset,
          uploadDate: json.uploadDate,
          uploadId: json.uploadId,
          dataQualityCheck: json.dataQualityCheck,
          generatedDate: new Date().toLocaleString(),
          fileName: `${json.country}_${json.dataset}_${json.uploadId}.csv`
        };
        
        const pdfBuffer = await pdfGenerator.generateDQReportPDF(pdfData);
        
        if (pdfBuffer && pdfBuffer.length > 0) {
          const base64Content = Buffer.from(pdfBuffer).toString('base64');
          
          pdfAttachment = {
            filename: `DQ_Report_${json.country}_${json.uploadId}.pdf`,
            content: base64Content,
            contentType: 'application/pdf'
          };
        }
        
        await pdfGenerator.close();
      } catch (error) {
        console.error('Error generating PDF:', error);
        console.error('PDF generation failed, continuing without attachment');
        // Continue without PDF attachment if generation fails
        pdfAttachment = null;
      }
    }
    
    const emailProps = {
      ...json,
      pdfAttachment
    };
    
    const html = await render(<DataQualityReport {...emailProps} />);
    const text = await render(<DataQualityReport {...emailProps} />, {
      plainText: true,
    });
    
    return ctx.json({ 
      html, 
      text, 
      attachments: pdfAttachment ? [pdfAttachment] : []
    });
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
