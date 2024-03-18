import axios, { AxiosResponse, Method } from "axios";

export default function route() {
  const axi = axios.create();

  return {
    apiKeyAuthRequest: async (params: {
      method: Method;
      apiKeyName: string;
      apiKeyValue: string;
      queryParams: Record<string, unknown>;
      requestBody?: Record<string, unknown>;
      url: string;
    }): Promise<AxiosResponse> => {
      const { apiKeyName, apiKeyValue, method, queryParams, requestBody, url } =
        params;
      return await axi({
        method: method,
        data: requestBody,
        url: url,
        params: queryParams,
        headers: { [apiKeyName]: apiKeyValue },
      });
    },
    basicAuthRequest: async (params: {
      method: Method;
      username: string;
      password: string;
      queryParams: Record<string, unknown>;
      requestBody?: Record<string, unknown>;
      url: string;
    }): Promise<AxiosResponse> => {
      const { username, password, method, queryParams, requestBody, url } =
        params;

      return await axi({
        method: method,
        data: requestBody,
        url: url,
        params: queryParams,
        auth: {
          username: username,
          password: password,
        },
      });
    },
    bearerRequest: async (params: {
      method: Method;
      bearerToken: string;
      queryParams: Record<string, unknown>;
      requestBody?: Record<string, unknown>;
      url: string;
    }): Promise<AxiosResponse> => {
      const { bearerToken, method, queryParams, requestBody, url } = params;

      return await axi({
        method: method,
        data: requestBody,
        params: queryParams,
        url: url,
        headers: { Authorization: `Bearer ${bearerToken}` },
      });
    },

    noAuthRequest: async (params: {
      method: Method;
      queryParams: Record<string, unknown>;
      requestBody?: Record<string, unknown>;
      url: string;
    }): Promise<AxiosResponse> => {
      const { method, queryParams, requestBody, url } = params;

      return await axi({
        method: method,
        data: requestBody,
        url: url,
        params: queryParams,
      });
    },
  };
}
