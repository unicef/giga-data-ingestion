import { StateCreator } from "zustand";

export interface UploadSliceState {
  uploadSlice: {
    columnMapping: Record<string, string>;
    detectedColumns: string[];
    file: File | null;
    timeStamp: Date | null;
    uploadDate: Date | null;
    uploadId: string;
    stepIndex: number;
  };
}

export interface UploadSliceActions {
  uploadSliceActions: {
    decrementStepIndex: () => void;
    incrementStepIndex: () => void;
    resetUploadSliceState: () => void;
    setStepIndex: (value: UploadSliceState["uploadSlice"]["stepIndex"]) => void;
    setUploadSliceState: (upload: UploadSliceState) => void;
    setColumnMapping: (
      value: UploadSliceState["uploadSlice"]["columnMapping"],
    ) => void;
    setDetectedColumns: (
      value: UploadSliceState["uploadSlice"]["detectedColumns"],
    ) => void;
    setFile: (value: UploadSliceState["uploadSlice"]["file"]) => void;
    setTimeStamp: (value: UploadSliceState["uploadSlice"]["timeStamp"]) => void;
    setUploadDate: (
      value: UploadSliceState["uploadSlice"]["uploadDate"],
    ) => void;
    setUploadId: (value: UploadSliceState["uploadSlice"]["uploadId"]) => void;
  };
}

export type UploadSlice = UploadSliceState & UploadSliceActions;

export const initialUploadSliceState: UploadSliceState = {
  uploadSlice: {
    columnMapping: {},
    detectedColumns: [],
    file: null,
    stepIndex: 0,
    timeStamp: null,
    uploadDate: null,
    uploadId: "",
  },
};

export const createUploadSlice: StateCreator<
  UploadSlice,
  [["zustand/immer", never], never],
  [],
  UploadSlice
> = set => ({
  ...initialUploadSliceState,

  uploadSliceActions: {
    decrementStepIndex: () =>
      set(state => {
        state.uploadSlice.stepIndex -= 1;
      }),
    incrementStepIndex: () =>
      set(state => {
        state.uploadSlice.stepIndex += 1;
      }),
    setUploadSliceState: (upload: UploadSliceState) =>
      set(state => {
        state.uploadSlice = {
          ...state.uploadSlice,
          ...upload.uploadSlice,
        };
      }),
    setUploadDate: uploadDate =>
      set(state => {
        state.uploadSlice.uploadDate = uploadDate;
      }),
    setFile: file =>
      set(state => {
        state.uploadSlice.file = file;
      }),
    setDetectedColumns: detectedColumns =>
      set(state => {
        state.uploadSlice.detectedColumns = detectedColumns;
      }),
    setUploadId: uploadId =>
      set(state => {
        state.uploadSlice.uploadId = uploadId;
      }),
    setStepIndex: stepIndex =>
      set(state => {
        state.uploadSlice.stepIndex = stepIndex;
      }),
    setTimeStamp: timeStamp =>
      set(state => {
        state.uploadSlice.timeStamp = timeStamp;
      }),
    setColumnMapping: columnMapping =>
      set(state => {
        state.uploadSlice.columnMapping = columnMapping;
      }),
    resetUploadSliceState: () =>
      set(state => {
        state.uploadSlice = { ...initialUploadSliceState.uploadSlice };
      }),
  },
});
