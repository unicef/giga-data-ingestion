import type { StateCreator } from "zustand";

import type { User } from "@/types/user";

import type { UploadSliceState } from "./uploadSlice";

interface AppStateSliceState {
  appState: {
    user: User;
    notification: boolean;
  };
}

interface AppStateSliceActions {
  appStateActions: {
    setUser: (user: User) => void;
    setNotificiation: (bool: boolean) => void;
  };
}

export interface AppStateSlice extends AppStateSliceState, AppStateSliceActions {}

const initialAppState: AppStateSliceState = {
  appState: {
    user: {
      name: "",
      email: "",
      roles: [],
    },
    notification: false,
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
    setNotificiation: (bool: boolean) =>
      set(state => {
        state.appState.notification = bool;
      }),
  },
});
