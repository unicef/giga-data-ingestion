import {
  Configuration,
  EndSessionRequest,
  PopupRequest,
} from "@azure/msal-browser";

const {
  VITE_AZURE_CLIENT_ID: AZURE_CLIENT_ID,
  VITE_AZURE_TENANT_NAME: AZURE_TENANT_NAME,
  VITE_AZURE_AUTH_POLICY_NAME: AZURE_AUTH_POLICY_NAME,
} = import.meta.env;

export const msalConfig: Configuration = {
  auth: {
    clientId: AZURE_CLIENT_ID,
    authority: `https://${AZURE_TENANT_NAME}.b2clogin.com/${AZURE_TENANT_NAME}.onmicrosoft.com/${AZURE_AUTH_POLICY_NAME}`,
    knownAuthorities: [`${AZURE_TENANT_NAME}.b2clogin.com`],
    redirectUri: "/",
    postLogoutRedirectUri: "/",
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "localStorage",
  },
  system: {
    allowNativeBroker: false,
    // loggerOptions: {
    //   loggerCallback: (level, message, containsPii) => {
    //     if (containsPii) return;
    //
    //     if (import.meta.env.PROD) {
    //       if (level === LogLevel.Error) return console.error(message);
    //       else return;
    //     } else {
    //       switch (level) {
    //         case LogLevel.Error:
    //           return console.error(message);
    //         case LogLevel.Info:
    //           return console.info(message);
    //         case LogLevel.Verbose:
    //           return console.debug(message);
    //         case LogLevel.Warning:
    //           return console.warn(message);
    //         default:
    //           return;
    //       }
    //     }
    //   },
    // },
  },
};

export const loginRequest: PopupRequest = {
  scopes: [
    `https://${AZURE_TENANT_NAME}.onmicrosoft.com/${AZURE_CLIENT_ID}/User.Impersonate`,
  ],
};

export const logoutRequest: EndSessionRequest = {
  postLogoutRedirectUri: "/",
};
