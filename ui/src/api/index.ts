import { QueryClient } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";

const baseURL = "/api";

export const axi = axios.create({
  baseURL,
  withCredentials: true,
});

export const api = {
  health: (): Promise<AxiosResponse<string>> => {
    return axi.get("");
  },
};

export const queryClient = new QueryClient();
