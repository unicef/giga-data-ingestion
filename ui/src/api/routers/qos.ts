import { AxiosInstance, AxiosResponse } from "axios";

import {
  PagedSchoolListResponse,
  SchoolConnectivityResponse,
  SchoolListResponse,
} from "@/types/qos";

export default function route(axi: AxiosInstance) {
  return {
    list_school_list: (params: {
      count: number;
      page: number;
    }): Promise<AxiosResponse<PagedSchoolListResponse>> => {
      return axi.get("/qos/school_list", {
        params: {
          count: params.count,
          page: params.page,
        },
      });
    },
    get_school_list: (
      id: string,
    ): Promise<AxiosResponse<SchoolListResponse>> => {
      return axi.get(`/qos/school_list/${id}`);
    },
    get_school_connectivity: (
      id: string,
    ): Promise<AxiosResponse<SchoolConnectivityResponse>> => {
      return axi.get(`/qos/school_connectivity/${id}`);
    },
    update_school_list_status: (params: {
      id: string;
      enabled: boolean;
    }): Promise<AxiosResponse<null>> => {
      return axi.patch(
        `/qos/school_list/${params.id}/status/${params.enabled}`,
        {
          params: {
            id: params.id,
            enabled: params.enabled,
          },
        },
      );
    },
  };
}
