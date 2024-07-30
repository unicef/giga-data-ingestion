import type { DataTableHeader } from "@carbon/react";
import type { StateCreator } from "zustand";

import type { KeyValueObject } from "@/types/datatable";

interface ApproveRowSliceState {
  approveRowState: {
    approvedRows: string[];
    rejectedRows: string[];
    headers: DataTableHeader[];
    rows: KeyValueObject[];
    totalCount: number;
  };
}

interface ApproveRowSliceActions {
  approveRowActions: {
    setHeaders: (header: ApproveRowSliceState["approveRowState"]["headers"]) => void;
    setRows: (row: ApproveRowSliceState["approveRowState"]["rows"]) => void;
    setApprovedRows: (
      approvedRows: ApproveRowSliceState["approveRowState"]["approvedRows"],
    ) => void;
    setRejectedRows: (
      rejectedRows: ApproveRowSliceState["approveRowState"]["rejectedRows"],
    ) => void;
    resetApproveRowState: () => void;
    setTotalCount: (count: number) => void;
  };
}

export interface ApproveRowSlice extends ApproveRowSliceState, ApproveRowSliceActions {}

const initialAppState: ApproveRowSliceState = {
  approveRowState: {
    approvedRows: [],
    rejectedRows: [],
    headers: [],
    rows: [],
    totalCount: 0,
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
          state.approveRowState.approvedRows = [];
          state.approveRowState.rejectedRows = [];

          state.approveRowState.headers = [];
          state.approveRowState.rows = [];

          state.approveRowState.totalCount = 0;
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
    setTotalCount: count =>
      set(
        state => {
          state.approveRowState.totalCount = count;
        },
        REPLACE_FLAG_DEFAULT,
        "approveRowSlice/setTotalCount",
      ),
  },
});
