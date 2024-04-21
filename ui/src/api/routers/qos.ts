import { AxiosInstance, AxiosResponse } from "axios";

import {
  CreateApiIngestionRequest,
  EditApiIngestionRequest,
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
    }): Promise<AxiosResponse<void>> => {
      return axi.patch(
        `/qos/school_list/${params.id}/status/`,
        {},
        {
          params: {
            enabled: params.enabled,
          },
        },
      );
    },
    create_api_ingestion: (
      params: CreateApiIngestionRequest,
    ): Promise<AxiosResponse<never>> => {
      const formData = new FormData();

      const jsonSchoolConnectivity = JSON.stringify(params.school_connectivity);
      const jsonSchoolList = JSON.stringify(params.school_list);

      formData.append("school_connectivity", jsonSchoolConnectivity);
      formData.append("school_list", jsonSchoolList);
      if (params.file) {
        formData.append("file", params.file);
      }

      return axi.post("/qos/api_ingestion", formData);
    },
    update_api_ingestion: (params: {
      body: EditApiIngestionRequest;
      id: string;
    }): Promise<AxiosResponse<void>> => {
      return axi.patch(`/qos/api_ingestion/${params.id}`, {
        school_connectivity: params.body.school_connectivity,
        school_list: params.body.school_list,
      });
    },
  };
}
