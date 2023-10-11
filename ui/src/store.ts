import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { User } from "@/types/user.ts";

interface AppState {
  user: User;
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
