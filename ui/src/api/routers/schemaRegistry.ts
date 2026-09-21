import { AxiosInstance, AxiosResponse } from "axios";

import {
  CreateDatasetGroupRequest,
  CreateProposalRequest,
  DatasetGroup,
  DatasetVersion,
  Proposal,
  ProposalDetail,
  RegistryColumn,
  SchemaDataset,
} from "@/types/schemaRegistry.ts";

export default function routes(axi: AxiosInstance) {
  return {
    listGroups: (): Promise<AxiosResponse<DatasetGroup[]>> => {
      return axi.get("/schema-registry/groups");
    },
    createGroup: (
      body: CreateDatasetGroupRequest,
    ): Promise<AxiosResponse<DatasetGroup>> => {
      return axi.post("/schema-registry/groups", body);
    },
    listDatasets: (): Promise<AxiosResponse<SchemaDataset[]>> => {
      return axi.get("/schema-registry/datasets");
    },
    getDataset: (key: string): Promise<AxiosResponse<SchemaDataset>> => {
      return axi.get(`/schema-registry/datasets/${key}`);
    },
    moveDataset: ({
      key,
      group_id,
    }: {
      key: string;
      group_id: string | null;
    }): Promise<AxiosResponse<SchemaDataset>> => {
      return axi.patch(`/schema-registry/datasets/${key}/move`, { group_id });
    },
    listColumns: (
      key: string,
      as_of_version?: number,
    ): Promise<AxiosResponse<RegistryColumn[]>> => {
      return axi.get(`/schema-registry/datasets/${key}/columns`, {
        params: as_of_version ? { as_of_version } : undefined,
      });
    },
    listVersions: (key: string): Promise<AxiosResponse<DatasetVersion[]>> => {
      return axi.get(`/schema-registry/datasets/${key}/versions`);
    },
    getVersionSnapshot: (
      key: string,
      version: number,
    ): Promise<AxiosResponse<RegistryColumn[]>> => {
      return axi.get(`/schema-registry/datasets/${key}/versions/${version}`);
    },
    diffVersions: (
      key: string,
      version: number,
      otherVersion: number,
    ): Promise<
      AxiosResponse<
        {
          column_name: string;
          diff: { field: string; before: unknown; after: unknown }[];
        }[]
      >
    > => {
      return axi.get(
        `/schema-registry/datasets/${key}/versions/${version}/diff/${otherVersion}`,
      );
    },
    createProposal: ({
      datasetKey,
      body,
    }: {
      datasetKey: string;
      body: CreateProposalRequest;
    }): Promise<AxiosResponse<Proposal>> => {
      return axi.post(
        `/schema-registry/datasets/${datasetKey}/proposals`,
        body,
      );
    },
    listProposals: (params?: {
      status?: string;
      dataset_key?: string;
    }): Promise<AxiosResponse<Proposal[]>> => {
      return axi.get("/schema-registry/proposals", { params });
    },
    getProposal: (id: string): Promise<AxiosResponse<ProposalDetail>> => {
      return axi.get(`/schema-registry/proposals/${id}`);
    },
    approveProposal: (id: string): Promise<AxiosResponse<Proposal>> => {
      return axi.post(`/schema-registry/proposals/${id}/approve`);
    },
    rejectProposal: (id: string): Promise<AxiosResponse<Proposal>> => {
      return axi.post(`/schema-registry/proposals/${id}/reject`);
    },
  };
}
