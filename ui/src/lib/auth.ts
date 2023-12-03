import { Configuration, LogLevel, PopupRequest } from "@azure/msal-browser";
import { AuthProviderProps } from "oidc-react";

const {
  VITE_AZURE_CLIENT_ID: AZURE_CLIENT_ID,
  VITE_ZITADEL_AUTHORITY: ZITADEL_AUTHORITY,
  VITE_ZITADEL_CLIENT_ID: ZITADEL_CLIENT_ID,
} = import.meta.env;

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
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;

        if (import.meta.env.PROD) {
          if (level === LogLevel.Error) return console.error(message);
          else return;
        } else {
          switch (level) {
            case LogLevel.Error:
              return console.error(message);
            case LogLevel.Info:
              return console.info(message);
            case LogLevel.Verbose:
              return console.debug(message);
            case LogLevel.Warning:
              return console.warn(message);
            default:
              return;
          }
        }
      },
    },
  },
};

export const loginRequest: PopupRequest = {
  scopes: [`api://${AZURE_CLIENT_ID}/user_impersonation`],
};

export const oidcConfig = {
  onSignIn: async () => {
    window.location.hash = "";
  },
  authority: ZITADEL_AUTHORITY,
  clientId: ZITADEL_CLIENT_ID,
  responseType: "code",
  redirectUri: "http://localhost:3000",
  scope: "openid profile email",
} satisfies AuthProviderProps;
