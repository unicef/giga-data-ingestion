import axios, { AxiosResponse } from "axios";

export default function route() {
  const axi = axios.create();

  return {
    bearerGetRequest: async (params: {
      bearerToken: string;
      queryParams: Record<string, unknown>;
      url: string;
    }): Promise<AxiosResponse> => {
      const { bearerToken, queryParams, url } = params;

      return await axi.get(url, {
        params: queryParams,
        headers: { Authorization: `Bearer ${bearerToken}` },
      });
    },
    basicAuthGetRequest: async (params: {
      username: string;
      password: string;
      queryParams: Record<string, unknown>;
      url: string;
    }): Promise<AxiosResponse> => {
      const { username, password, queryParams, url } = params;

      return await axi.get(url, {
        params: queryParams,
        auth: {
          username: username,
          password: password,
        },
      });
    },
    apiKeyAuthGetRequest: async (params: {
      apiKeyName: string;
      apiKeyValue: string;
      queryParams: Record<string, unknown>;
      url: string;
    }): Promise<AxiosResponse> => {
      const { apiKeyName, apiKeyValue, queryParams, url } = params;

      return await axi.get(url, {
        params: queryParams,
        headers: { [apiKeyName]: apiKeyValue },
      });
    },
  };
}
