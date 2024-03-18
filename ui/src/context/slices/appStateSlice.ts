import { StateCreator } from "zustand";

import { User } from "@/types/user";

import { UploadSliceState } from "./uploadSlice";

interface AppStateSliceState {
  appState: {
    user: User;
    fullPageLoading: boolean;
  };
}

interface AppStateSliceActions {
  appStateActions: {
    setUser: (user: User) => void;
    setFullPageLoading: (loading: boolean) => void;
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
    fullPageLoading: true,
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
    setFullPageLoading: (loading: boolean) =>
      set(state => {
        state.appState.fullPageLoading = loading;
      }),
  },
});
