import axios, { AxiosResponse } from "axios";

export default function route() {
  const axi = axios.create();

  return {
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

    noneAuthGetRequest: async (params: {
      queryParams: Record<string, unknown>;
      url: string;
    }): Promise<AxiosResponse> => {
      const { queryParams, url } = params;

      return await axi.get(url, {
        params: queryParams,
      });
    },

    apiKeyPostRequest: async (params: {
      apiKeyName: string;
      apiKeyValue: string;
      queryParams: Record<string, unknown>;
      requestBody: Record<string, unknown>;
      url: string;
    }): Promise<AxiosResponse> => {
      const { apiKeyName, apiKeyValue, queryParams, url, requestBody } = params;

      return await axi.post(url, requestBody, {
        params: queryParams,
        withCredentials: false,
        headers: { [apiKeyName]: apiKeyValue },
      });
    },

    basicPostRequest: async (params: {
      username: string;
      password: string;
      queryParams: Record<string, unknown>;
      requestBody: Record<string, unknown>;
      url: string;
    }): Promise<AxiosResponse> => {
      const { username, password, queryParams, url, requestBody } = params;

      return await axi.post(url, requestBody, {
        params: queryParams,
        withCredentials: false,
        auth: {
          username: username,
          password: password,
        },
      });
    },

    bearerPostRequest: async (params: {
      bearerToken: string;
      queryParams: Record<string, unknown>;
      requestBody: Record<string, unknown>;
      url: string;
    }): Promise<AxiosResponse> => {
      const { bearerToken, queryParams, url, requestBody } = params;

      return await axi.post(url, requestBody, {
        params: queryParams,
        withCredentials: false,
        headers: { Authorization: `Bearer ${bearerToken}` },
      });
    },

    noneAuthPostRequest: async (params: {
      queryParams: Record<string, unknown>;
      requestBody: Record<string, unknown>;
      url: string;
    }): Promise<AxiosResponse> => {
      const { queryParams, url, requestBody } = params;

      return await axi.post(url, requestBody, {
        params: queryParams,
        withCredentials: false,
      });
    },
  };
}
