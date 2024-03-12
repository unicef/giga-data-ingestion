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
    setUploadSliceState: (upload: UploadSliceState) => void;
  };
}

export interface UploadSlice extends UploadSliceState, UploadSliceActions {}

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
    resetUploadSliceState: () =>
      set(state => {
        state.uploadSlice = { ...initialUploadSliceState.uploadSlice };
      }),
  },
});
