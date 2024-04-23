import { DataTableHeader } from "@carbon/react";
import { StateCreator } from "zustand";

import { KeyValueObject } from "@/types/datatable";

interface ApproveRowSliceState {
  approveRowState: {
    approvedRowsList: string[];
    rejectedRowsList: string[];
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
      approvedRows: ApproveRowSliceState["approveRowState"]["approvedRowsList"],
    ) => void;
    setRejectedRows: (
      rejectedRows: ApproveRowSliceState["approveRowState"]["rejectedRowsList"],
    ) => void;
    resetApproveRowState: () => void;
  };
}

export interface ApproveRowSlice
  extends ApproveRowSliceState,
    ApproveRowSliceActions {}

const initialAppState: ApproveRowSliceState = {
  approveRowState: {
    approvedRowsList: [],
    rejectedRowsList: [],
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
          state.approveRowState.approvedRowsList = [];
          state.approveRowState.rejectedRowsList = [];

          state.approveRowState.headers = [];
          state.approveRowState.rows = [];
        },
        REPLACE_FLAG_DEFAULT,
        "approveRowSlice/resetApproveRowState",
      ),
    setApprovedRows: approvedRows =>
      set(
        state => {
          state.approveRowState.approvedRowsList = approvedRows;
        },
        REPLACE_FLAG_DEFAULT,
        "approveRowSlice/setApprovedRows",
      ),
    setRejectedRows: rejectedRows =>
      set(
        state => {
          state.approveRowState.rejectedRowsList = rejectedRows;
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
