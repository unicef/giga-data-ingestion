import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { User } from "@/types/user.ts";

const { DEV } = import.meta.env;

type FeatureFlagKeys =
  | "uploadFilePage"
  | "ingestApiPage"
  | "userManagementPage";

type FeatureFlags = Record<FeatureFlagKeys, boolean>;

interface UploadState {
  file: File | null;
  timestamp: Date | null;
  uploadId: string;
  uploadDate: string;
}

interface AppState {
  user: User;
  upload: UploadState;
  featureFlags: FeatureFlags;
}

interface AppActions {
  setUser: (user: User) => void;
  setUpload: (upload: UploadState) => void;
  resetUploadState: () => void;
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
  upload: initialUploadState,
  featureFlags: {
    uploadFilePage: DEV,
    ingestApiPage: DEV,
    userManagementPage: true,
  },
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
        setUpload: (upload: UploadState) =>
          set(state => {
            state.upload = upload;
          }),
        resetUploadState: () =>
          set(state => {
            state.upload = initialUploadState;
          }),
      }),
      {
        enabled: !import.meta.env.PROD,
      },
    ),
  ),
);
