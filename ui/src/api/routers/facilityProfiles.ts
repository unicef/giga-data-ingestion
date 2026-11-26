import { AxiosInstance, AxiosResponse } from "axios";

export type FacilityProfileSummary = {
  schema_key: string;
  facility_type: string;
  approval_label: string;
};

export default function routes(axi: AxiosInstance) {
  return {
    list: (): Promise<AxiosResponse<FacilityProfileSummary[]>> => {
      return axi.get("/facility-profiles");
    },
    listKeys: (): Promise<AxiosResponse<string[]>> => {
      return axi.get("/facility-profiles/keys");
    },
  };
}
