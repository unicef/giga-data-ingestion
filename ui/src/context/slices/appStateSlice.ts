import { StateCreator } from "zustand";

import { User } from "@/types/user";

import { UploadSliceState } from "./uploadSlice";

interface AppStateSliceState {
  appState: {
    user: User;
  };
}

interface AppStateSliceActions {
  appStateActions: {
    setUser: (user: User) => void;
  };
}

export interface AppStateSlice
  extends AppStateSliceState,
    AppStateSliceActions {}

const initialAppState: AppStateSliceState = {
  appState: {
    user: {
      name: "",
      email: "",
      roles: [],
    },
  },
};

export const createAppStateSlice: StateCreator<
  AppStateSlice & UploadSliceState,
  [["zustand/immer", never], never],
  [],
  AppStateSlice
> = set => ({
  ...initialAppState,
  appStateActions: {
    setUser: (user: User) =>
      set(state => {
        state.appState.user = user;
      }),
  },
});
