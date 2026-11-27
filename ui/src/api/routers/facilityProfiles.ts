import { AxiosInstance, AxiosResponse } from "axios";

import { FacilityMetadataFormConfig } from "@/utils/facilityMetadataForm.ts";

export type FacilityProfileSummary = {
  schema_key: string;
  facility_type: string;
  approval_label: string;
};

export type FacilityProfileDetail = {
  schema_key: string;
  facility_type: string;
  dataset_type: string;
  portal: {
    approval_label: string;
    approval_domain: string;
    metadata: FacilityMetadataFormConfig | null;
  };
};

export default function routes(axi: AxiosInstance) {
  return {
    list: (): Promise<AxiosResponse<FacilityProfileSummary[]>> => {
      return axi.get("/facility-profiles");
    },
    listKeys: (): Promise<AxiosResponse<string[]>> => {
      return axi.get("/facility-profiles/keys");
    },
    get: (schemaKey: string): Promise<AxiosResponse<FacilityProfileDetail>> => {
      return axi.get(`/facility-profiles/${schemaKey}`);
    },
  };
}
