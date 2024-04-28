import { DataTableHeader } from "@carbon/react";
import { StateCreator } from "zustand";

import { KeyValueObject } from "@/types/datatable";

export interface CDFSelector {
  school_id_giga: string;
  _change_type: "insert" | "update_preimage" | "update_postimage" | "delete";
  _commit_version: number;
}

interface ApproveRowSliceState {
  approveRowState: {
    approvedRows: Record<string, CDFSelector>;
    rejectedRows: Record<string, CDFSelector>;
    headers: DataTableHeader[];
    rows: KeyValueObject[];
  };
}

interface ApproveRowSliceActions {
  approveRowActions: {
    setHeaders: (
      header: ApproveRowSliceState["approveRowState"]["headers"],
    ) => void;
    setRows: (row: ApproveRowSliceState["approveRowState"]["rows"]) => void;
    setApprovedRows: (
      approvedRows: ApproveRowSliceState["approveRowState"]["approvedRows"],
    ) => void;
    setRejectedRows: (
      rejectedRows: ApproveRowSliceState["approveRowState"]["rejectedRows"],
    ) => void;
    resetApproveRowState: () => void;
  };
}

export interface ApproveRowSlice
  extends ApproveRowSliceState,
    ApproveRowSliceActions {}

const initialAppState: ApproveRowSliceState = {
  approveRowState: {
    approvedRows: {},
    rejectedRows: {},
    headers: [],
    rows: [],
  },
};

const REPLACE_FLAG_DEFAULT = false;

export const createApproveRowSlice: StateCreator<
  ApproveRowSlice,
  [["zustand/immer", never], never],
  [],
  ApproveRowSlice
> = set => ({
  ...initialAppState,
  approveRowActions: {
    resetApproveRowState: () =>
      set(
        state => {
          state.approveRowState.approvedRows = {};
          state.approveRowState.rejectedRows = {};

          state.approveRowState.headers = [];
          state.approveRowState.rows = [];
        },
        REPLACE_FLAG_DEFAULT,
        "approveRowSlice/resetApproveRowState",
      ),
    setApprovedRows: approvedRows =>
      set(
        state => {
          state.approveRowState.approvedRows = approvedRows;
        },
        REPLACE_FLAG_DEFAULT,
        "approveRowSlice/setApprovedRows",
      ),
    setRejectedRows: rejectedRows =>
      set(
        state => {
          state.approveRowState.rejectedRows = rejectedRows;
        },
        REPLACE_FLAG_DEFAULT,
        "approveRowSlice/setRejectedRows",
      ),
    setHeaders: header =>
      set(
        state => {
          state.approveRowState.headers = header;
        },
        REPLACE_FLAG_DEFAULT,
        "approveRowSlice/setHeaders",
      ),
    setRows: rows =>
      set(
        state => {
          state.approveRowState.rows = rows;
        },
        REPLACE_FLAG_DEFAULT,
        "approveRowSlice/setRows",
      ),
  },
});
