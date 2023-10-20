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

interface AppState {
  user: User;
  featureFlags: FeatureFlags;
}

interface AppActions {
  setUser: (user: User) => void;
}

const initialState: AppState = {
  user: {
    name: "",
    email: "",
    roles: [],
  },
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
      }),
      {
        enabled: !import.meta.env.PROD,
      },
    ),
  ),
);
