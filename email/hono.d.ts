declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production";
    DEPLOY_ENV: "local" | "dev" | "stg" | "prd";
    COMMIT_SHA: string;
    EMAIL_RENDERER_BEARER_TOKEN: string;
    SENTRY_DSN?: string;
    WEB_APP_REDIRECT_URI: string;
  }
}
