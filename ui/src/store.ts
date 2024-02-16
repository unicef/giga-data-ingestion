import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { User } from "@/types/user.ts";

interface UploadState {
  file: File | null;
  timestamp: Date | null;
  uploadId: string;
  uploadDate: string;
}

interface AppState {
  user: User;
  fullPageLoading: boolean;
  upload: UploadState;
  isAppReady: boolean;
}

interface AppActions {
  setUser: (user: User) => void;
  setFullPageLoading: (loading: boolean) => void;
  setUpload: (upload: UploadState) => void;
  resetUploadState: () => void;
  setIsAppReady: (ready: boolean) => void;
}

const initialUploadState: UploadState = {
  file: null,
  timestamp: null,
  uploadId: "",
  uploadDate: "",
};

const initialState: AppState = {
  user: {
    name: "",
    email: "",
    roles: [],
  },
  fullPageLoading: true,
  upload: initialUploadState,
  isAppReady: false,
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
        setUpload: (upload: UploadState) =>
          set(state => {
            state.upload = upload;
          }),
        resetUploadState: () =>
          set(state => {
            state.upload = initialUploadState;
          }),
        setIsAppReady: (ready: boolean) =>
          set(state => {
            state.isAppReady = ready;
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
