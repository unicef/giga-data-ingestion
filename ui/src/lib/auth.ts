import {
  type Configuration,
  type EndSessionRequest,
  LogLevel,
  type PopupRequest,
  PublicClientApplication,
} from "@azure/msal-browser";

const {
  VITE_AZURE_CLIENT_ID: AZURE_CLIENT_ID,
  VITE_AZURE_TENANT_NAME: AZURE_TENANT_NAME,
  VITE_AZURE_SUSI_AUTH_POLICY_NAME: AZURE_SUSI_AUTH_POLICY_NAME,
  VITE_AZURE_EDIT_PROFILE_AUTH_POLICY_NAME: AZURE_EDIT_PROFILE_AUTH_POLICY_NAME,
  VITE_AZURE_PASSWORD_RESET_AUTH_POLICY_NAME: AZURE_PASSWORD_RESET_AUTH_POLICY_NAME,
  VITE_REDIRECT_URL: REDIRECT_URL,
} = import.meta.env;

export const b2cPolicies = {
  names: {
    signUpSignIn: AZURE_SUSI_AUTH_POLICY_NAME,
    passwordReset: AZURE_PASSWORD_RESET_AUTH_POLICY_NAME,
    editProfile: AZURE_EDIT_PROFILE_AUTH_POLICY_NAME,
  },
  authorities: {
    signUpSignIn: {
      authority: `https://${AZURE_TENANT_NAME}.b2clogin.com/${AZURE_TENANT_NAME}.onmicrosoft.com/${AZURE_SUSI_AUTH_POLICY_NAME}`,
    },
    passwordReset: {
      authority: `https://${AZURE_TENANT_NAME}.b2clogin.com/${AZURE_TENANT_NAME}.onmicrosoft.com/${AZURE_PASSWORD_RESET_AUTH_POLICY_NAME}`,
    },
    editProfile: {
      authority: `https://${AZURE_TENANT_NAME}.b2clogin.com/${AZURE_TENANT_NAME}.onmicrosoft.com/${AZURE_EDIT_PROFILE_AUTH_POLICY_NAME}`,
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
    redirectUri: REDIRECT_URL,
    postLogoutRedirectUri: REDIRECT_URL,
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
