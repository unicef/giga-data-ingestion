import puppeteer from "puppeteer";
import { render } from "@react-email/render";
import type React from "react";

export async function generatePDF(
  component: React.ReactElement,
  options?: {
    format?: "A4" | "Letter";
    printBackground?: boolean;
  }
): Promise<Buffer> {
  const html = await render(component);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-extensions",
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    });

    const page = await browser.newPage();

    // Set content and wait for it to be fully loaded
    await page.setContent(html, {
      waitUntil: ["networkidle0", "load", "domcontentloaded"],
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: options?.format || "A4",
      printBackground: options?.printBackground !== false,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
      preferCSSPageSize: false,
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function generatePDFBase64(
  component: React.ReactElement,
  options?: {
    format?: "A4" | "Letter";
    printBackground?: boolean;
  }
): Promise<string> {
  const buffer = await generatePDF(component, options);
  return buffer.toString("base64");
}
