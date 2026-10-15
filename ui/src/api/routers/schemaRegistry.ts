import { AxiosInstance, AxiosResponse } from "axios";

import {
  AuditLogEntry,
  CreateDatasetGroupRequest,
  CreateProposalRequest,
  DatasetGroup,
  DatasetGroupDetail,
  DatasetImportResponse,
  DatasetVersion,
  Proposal,
  ProposalDetail,
  RegistryColumn,
  ResolvedSchema,
  SchemaDataset,
  SchemaImpact,
  SchemaRole,
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
    getGroup: (key: string): Promise<AxiosResponse<DatasetGroupDetail>> => {
      return axi.get(`/schema-registry/groups/${key}`);
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
      role,
    }: {
      key: string;
      group_id: string | null;
      role?: SchemaRole;
    }): Promise<AxiosResponse<SchemaDataset>> => {
      return axi.patch(`/schema-registry/datasets/${key}/move`, {
        group_id,
        role,
      });
    },
    getResolvedSchema: (
      key: string,
      member_version?: number,
      core_version?: number,
    ): Promise<AxiosResponse<ResolvedSchema>> => {
      return axi.get(`/schema-registry/datasets/${key}/resolved`, {
        params: { member_version, core_version },
      });
    },
    getSchemaImpact: (key: string): Promise<AxiosResponse<SchemaImpact>> => {
      return axi.get(`/schema-registry/datasets/${key}/impact`);
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
    rejectProposal: ({
      id,
      reason,
    }: {
      id: string;
      reason: string;
    }): Promise<AxiosResponse<Proposal>> => {
      return axi.post(`/schema-registry/proposals/${id}/reject`, { reason });
    },
    importDatasetColumns: ({
      datasetKey,
      file,
    }: {
      datasetKey: string;
      file: File;
    }): Promise<AxiosResponse<DatasetImportResponse>> => {
      const formData = new FormData();
      formData.append("file", file);
      return axi.post(
        `/schema-registry/datasets/${datasetKey}/import`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
    },
    listAuditLog: (params?: {
      dataset_key?: string;
      column_name?: string;
      actor_id?: string;
      action?: string;
      limit?: number;
      offset?: number;
    }): Promise<AxiosResponse<AuditLogEntry[]>> => {
      return axi.get("/schema-registry/audit", { params });
    },
  };
}
