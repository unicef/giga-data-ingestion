import { DataTableHeader } from "@carbon/react";
import { StateCreator } from "zustand";

import { TransformedRow } from "@/routes/approval-requests/$subpath";

interface ApproveRowSliceState {
  approveRowState: {
    approvedRowsList: string[];
    headers: DataTableHeader[];
    rows: TransformedRow[];
  };
}

interface ApproveRowSliceActions {
  approveRowActions: {
    setHeaders: (header: DataTableHeader[]) => void;
    setRows: (row: TransformedRow[]) => void;
    setApprovedRowsList: (approvedRows: string[]) => void;
    resetApproveRowState: () => void;
  };
}

export interface ApproveRowSlice
  extends ApproveRowSliceState,
    ApproveRowSliceActions {}

const initialAppState: ApproveRowSliceState = {
  approveRowState: {
    approvedRowsList: [],
    headers: [],
    rows: [],
  },
};

export const createApproveRowSlice: StateCreator<
  ApproveRowSlice,
  [["zustand/immer", never], never],
  [],
  ApproveRowSlice
> = set => ({
  ...initialAppState,
  approveRowActions: {
    resetApproveRowState: () =>
      set(state => {
        state.approveRowState.approvedRowsList = [];
        state.approveRowState.headers = [];
        state.approveRowState.rows = [];
      }),
    setApprovedRowsList: (approvedRows: Array<string>) =>
      set(state => {
        state.approveRowState.approvedRowsList = approvedRows;
      }),
    setHeaders: (header: DataTableHeader[]) =>
      set(state => {
        state.approveRowState.headers = header;
      }),
    setRows: (rows: TransformedRow[]) =>
      set(state => {
        state.approveRowState.rows = rows;
      }),
  },
});
