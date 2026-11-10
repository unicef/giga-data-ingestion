import { AxiosInstance, AxiosResponse } from "axios";

import {
  AuditLogEntry,
  CreateDatasetGroupRequest,
  CreateProposalRequest,
  CreateSchemaDatasetRequest,
  DatasetCreateFromCsvResponse,
  DatasetGroup,
  DatasetGroupDetail,
  DatasetImportResponse,
  DatasetVersion,
  LifecyclePreview,
  PromotionPreview,
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
    listGroups: (
      includeArchived = false,
    ): Promise<AxiosResponse<DatasetGroup[]>> => {
      return axi.get("/schema-registry/groups", {
        params: { include_archived: includeArchived },
      });
    },
    createGroup: (
      body: CreateDatasetGroupRequest,
    ): Promise<AxiosResponse<DatasetGroup>> => {
      return axi.post("/schema-registry/groups", body);
    },
    getGroup: (
      key: string,
      includeArchived = false,
    ): Promise<AxiosResponse<DatasetGroupDetail>> => {
      return axi.get(`/schema-registry/groups/${key}`, {
        params: { include_archived: includeArchived },
      });
    },
    listDatasets: (
      includeArchived = false,
    ): Promise<AxiosResponse<SchemaDataset[]>> => {
      return axi.get("/schema-registry/datasets", {
        params: { include_archived: includeArchived },
      });
    },
    getDataset: (
      key: string,
      includeArchived = false,
    ): Promise<AxiosResponse<SchemaDataset>> => {
      return axi.get(`/schema-registry/datasets/${key}`, {
        params: { include_archived: includeArchived },
      });
    },
    createDataset: (
      body: CreateSchemaDatasetRequest,
    ): Promise<AxiosResponse<SchemaDataset>> => {
      return axi.post("/schema-registry/datasets", body);
    },
    createDatasetFromCsv: ({
      file,
      ...body
    }: CreateSchemaDatasetRequest & {
      file: File;
    }): Promise<AxiosResponse<DatasetCreateFromCsvResponse>> => {
      const formData = new FormData();
      formData.append("file", file);
      Object.entries(body).forEach(([key, value]) => {
        if (value != null) formData.append(key, value);
      });
      return axi.post("/schema-registry/datasets/from-csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    moveDataset: ({
      key,
      group_id,
      role,
    }: {
      key: string;
      group_id: string;
      role?: SchemaRole;
    }): Promise<AxiosResponse<SchemaDataset>> => {
      return axi.patch(`/schema-registry/datasets/${key}/move`, {
        group_id,
        role,
      });
    },
    getGroupLifecycle: (
      key: string,
    ): Promise<AxiosResponse<LifecyclePreview>> =>
      axi.get(`/schema-registry/groups/${key}/lifecycle`),
    archiveGroup: ({
      key,
      reason,
    }: {
      key: string;
      reason?: string;
    }): Promise<AxiosResponse<DatasetGroup>> =>
      axi.post(`/schema-registry/groups/${key}/archive`, { reason }),
    restoreGroup: (key: string): Promise<AxiosResponse<DatasetGroup>> =>
      axi.post(`/schema-registry/groups/${key}/restore`),
    deleteGroup: (key: string): Promise<AxiosResponse<void>> =>
      axi.delete(`/schema-registry/groups/${key}`),
    getDatasetLifecycle: (
      key: string,
    ): Promise<AxiosResponse<LifecyclePreview>> =>
      axi.get(`/schema-registry/datasets/${key}/lifecycle`),
    archiveDataset: ({
      key,
      reason,
    }: {
      key: string;
      reason?: string;
    }): Promise<AxiosResponse<SchemaDataset>> =>
      axi.post(`/schema-registry/datasets/${key}/archive`, { reason }),
    restoreDataset: (key: string): Promise<AxiosResponse<SchemaDataset>> =>
      axi.post(`/schema-registry/datasets/${key}/restore`),
    deleteDataset: (key: string): Promise<AxiosResponse<void>> =>
      axi.delete(`/schema-registry/datasets/${key}`),
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
    getPromotionPreview: ({
      datasetKey,
      columnName,
    }: {
      datasetKey: string;
      columnName: string;
    }): Promise<AxiosResponse<PromotionPreview>> =>
      axi.get(
        `/schema-registry/datasets/${datasetKey}/columns/${columnName}/promotion-preview`,
      ),
    listColumns: (
      key: string,
      as_of_version?: number,
    ): Promise<AxiosResponse<RegistryColumn[]>> => {
      return axi.get(`/schema-registry/datasets/${key}/columns`, {
        params: as_of_version ? { as_of_version } : undefined,
      });
    },
    getColumn: (
      key: string,
      name: string,
      as_of_version?: number,
    ): Promise<AxiosResponse<RegistryColumn>> => {
      return axi.get(`/schema-registry/datasets/${key}/columns/${name}`, {
        params: as_of_version ? { as_of_version } : undefined,
      });
    },
    getColumnHistory: (
      key: string,
      name: string,
    ): Promise<AxiosResponse<Proposal[]>> => {
      return axi.get(
        `/schema-registry/datasets/${key}/columns/${name}/history`,
      );
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
