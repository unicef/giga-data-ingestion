import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { User } from "@/types/user.ts";

interface UploadSlice {
  columnMapping: Record<string, string>;
  detectedColumns: string[];
  file: File | null;
  timestamp: Date | null;
  uploadId: string;
  uploadDate: Date | null;
  stepIndex: number;
}

interface AppState {
  user: User;
  fullPageLoading: boolean;
  upload: UploadSlice;
}

interface AppActions {
  setUser: (user: User) => void;
  setFullPageLoading: (loading: boolean) => void;
  setUpload: (upload: UploadSlice) => void;
  incrementStepIndex: () => void;
  decrementStepIndex: () => void;
  resetUploadState: () => void;
}

const initialUploadState: UploadSlice = {
  columnMapping: {},
  detectedColumns: [],
  file: null,
  timestamp: null,
  uploadId: "",
  uploadDate: null,
  stepIndex: 0,
};

const initialState: AppState = {
  user: {
    name: "",
    email: "",
    roles: [],
  },
  fullPageLoading: true,
  upload: initialUploadState,
};

export const useStore = create<AppState & AppActions>()(
  immer(
    devtools(
      set => ({
        ...initialState,
        setUser: (user: User) =>
          set(state => {
            state.user = user;
          }),
        setFullPageLoading: (loading: boolean) =>
          set(state => {
            state.fullPageLoading = loading;
          }),
        setUpload: (upload: UploadSlice) =>
          set(state => {
            state.upload = upload;
          }),
        incrementStepIndex: () =>
          set(state => {
            state.upload.stepIndex += 1;
          }),
        decrementStepIndex: () =>
          set(state => {
            state.upload.stepIndex -= 1;
          }),
        resetUploadState: () =>
          set(state => {
            state.upload = initialUploadState;
          }),
      }),
      {
        enabled: !import.meta.env.PROD,
        name: "ingestionPortalState",
        anonymousActionType: "zustand/action",
      },
    ),
  ),
);
