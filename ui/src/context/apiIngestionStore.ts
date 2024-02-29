import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { SchoolListFormValues, initialSchoolListFormValues } from "@/types/qos";

interface StoreState {
  stepIndex: number;
  schoolList: SchoolListFormValues;
  // schoolConnectivity: string;
}
interface StoreActions {
  setSchoolListFormValues: (upload: SchoolListFormValues) => void;
  incrementStepIndex: () => void;
  decrementStepIndex: () => void;
  resetQosState: () => void;
}

const initialState: StoreState = {
  stepIndex: 0,
  schoolList: initialSchoolListFormValues,
};

export const apiIngestionStore = create<StoreState & StoreActions>()(
  immer(
    devtools(
      set => ({
        ...initialState,
        setSchoolListFormValues: (schoolList: SchoolListFormValues) =>
          set(state => {
            state.schoolList = schoolList;
          }),
        incrementStepIndex: () =>
          set(state => {
            state.stepIndex += 1;
          }),
        decrementStepIndex: () =>
          set(state => {
            state.stepIndex -= 1;
          }),
        resetQosState: () =>
          set(state => {
            state.schoolList = initialSchoolListFormValues;
            state.stepIndex = 0;
          }),
      }),

      {
        enabled: !import.meta.env.PROD,
        name: "apiIngestionState",
        anonymousActionType: "zustand/action",
      },
    ),
  ),
);
