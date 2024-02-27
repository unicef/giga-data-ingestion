import {
  Configuration,
  EndSessionRequest,
  LogLevel,
  PopupRequest,
  PublicClientApplication,
} from "@azure/msal-browser";

const {
  VITE_AZURE_CLIENT_ID: AZURE_CLIENT_ID,
  VITE_AZURE_TENANT_NAME: AZURE_TENANT_NAME,
  VITE_AZURE_SUSI_AUTH_POLICY_NAME: B2C_SUSI_POLICY_NAME,
} = import.meta.env;

export const b2cPolicies = {
  names: {
    signUpSignIn: B2C_SUSI_POLICY_NAME,
  },
  authorities: {
    signUpSignIn: {
      authority: `https://${AZURE_TENANT_NAME}.b2clogin.com/${AZURE_TENANT_NAME}.onmicrosoft.com/${B2C_SUSI_POLICY_NAME}`,
    },
  },
  authorityDomain: `${AZURE_TENANT_NAME}.b2clogin.com`,
};

export const apiConfig = {
  b2cScopes: [
    `https://${AZURE_TENANT_NAME}.onmicrosoft.com/${AZURE_CLIENT_ID}/User.Impersonate`,
  ],
};

export const msalConfig: Configuration = {
  auth: {
    clientId: AZURE_CLIENT_ID,
    authority: b2cPolicies.authorities.signUpSignIn.authority,
    knownAuthorities: [b2cPolicies.authorityDomain],
    redirectUri: "/",
    postLogoutRedirectUri: "/",
    navigateToLoginRequestUrl: false,
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
            // case LogLevel.Verbose:
            //   return console.debug(message);
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
  scopes: apiConfig.b2cScopes,
};

export const logoutRequest: EndSessionRequest = {
  postLogoutRedirectUri: "/",
};

export const msalInstance = new PublicClientApplication(msalConfig);
