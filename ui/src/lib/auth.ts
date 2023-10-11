import { Configuration, LogLevel, PopupRequest } from "@azure/msal-browser";

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
