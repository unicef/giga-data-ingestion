declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production";
    DEPLOY_ENV: "local" | "dev" | "stg" | "prd";
    EMAIL_RENDERER_BEARER_TOKEN: string;
    NODE_SENTRY_DSN?: string;
    WEB_APP_REDIRECT_URI: string;
  }
}
