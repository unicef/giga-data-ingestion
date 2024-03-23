import { DataTableHeader } from "@carbon/react";
import { StateCreator } from "zustand";

import { KeyValueObject } from "@/types/datatable";

interface ApproveRowSliceState {
  approveRowState: {
    approvedRowsList: string[];
    headers: DataTableHeader[];
    rows: KeyValueObject[];
  };
}

interface ApproveRowSliceActions {
  approveRowActions: {
    setHeaders: (header: DataTableHeader[]) => void;
    setRows: (row: KeyValueObject[]) => void;
    setApprovedRows: (approvedRows: string[]) => void;
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
    setApprovedRows: (approvedRows: Array<string>) =>
      set(state => {
        state.approveRowState.approvedRowsList = approvedRows;
      }),
    setHeaders: (header: DataTableHeader[]) =>
      set(state => {
        state.approveRowState.headers = header;
      }),
    setRows: (rows: KeyValueObject[]) =>
      set(state => {
        state.approveRowState.rows = rows;
      }),
  },
});
