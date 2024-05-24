/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_CLIENT_ID: string;
  readonly VITE_AZURE_TENANT_ID: string;
  readonly VITE_AZURE_TENANT_NAME: string;
  readonly VITE_AZURE_SUSI_AUTH_POLICY_NAME: string;
  readonly VITE_AZURE_EDIT_PROFILE_AUTH_POLICY_NAME?: string;
  readonly VITE_AZURE_PASSWORD_RESET_AUTH_POLICY_NAME?: string;
  readonly VITE_DATAHUB_URL: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_DEPLOY_ENV: "local" | "dev" | "stg" | "prd";
  readonly VITE_COMMIT_SHA: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
