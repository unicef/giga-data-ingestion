import { AxiosInstance, AxiosResponse } from "axios";

export default function routes(axi: AxiosInstance) {
  return {
    getForCurrentUser: (): Promise<AxiosResponse<string[]>> => {
      return axi.get("/roles/me");
    },
  };
}
