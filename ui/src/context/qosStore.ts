import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { SchoolListFormValues, initialSchoolListFormValues } from "@/types/qos";

interface StoreState {
  stepIndex: number;
  columnMapping: Record<string, string>;
  schoolList: SchoolListFormValues;
  // schoolConnectivity: string;
}
interface StoreActions {
  setSchoolListFormValues: (formValues: SchoolListFormValues) => void;
  setColumnMapping: (columnMapping: Record<string, string>) => void;
  incrementStepIndex: () => void;
  decrementStepIndex: () => void;
  resetQosState: () => void;
}

const initialState: StoreState = {
  stepIndex: 0,
  columnMapping: {},
  schoolList: initialSchoolListFormValues,
};

export const useQosStore = create<StoreState & StoreActions>()(
  immer(
    devtools(
      set => ({
        ...initialState,
        setSchoolListFormValues: (schoolList: SchoolListFormValues) =>
          set(state => {
            state.schoolList = schoolList;
          }),
        setColumnMapping: (columnMapping: Record<string, string>) =>
          set(state => {
            state.columnMapping = columnMapping;
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
            state.columnMapping = {};
            state.stepIndex = 0;
            state.schoolList = initialSchoolListFormValues;
          }),
      }),

      {
        enabled: !import.meta.env.PROD,
        name: "qosStoreState",
        anonymousActionType: "zustand/action",
      },
    ),
  ),
);
