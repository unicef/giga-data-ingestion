import { Configuration, PopupRequest } from "@azure/msal-browser";

const { VITE_AZURE_CLIENT_ID: AZURE_CLIENT_ID } = import.meta.env;

export const msalConfig: Configuration = {
  auth: {
    clientId: AZURE_CLIENT_ID,
    authority: "https://login.microsoftonline.com/common",
    redirectUri: "/",
    postLogoutRedirectUri: "/",
  },
  cache: {
    cacheLocation: "localStorage",
  },
  system: {
    allowNativeBroker: false,
  },
};

export const loginRequest: PopupRequest = {
  scopes: [`api://${AZURE_CLIENT_ID}/user_impersonation`],
};
