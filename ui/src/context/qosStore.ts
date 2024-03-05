import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import {
  SchoolConnectivityFormValues,
  SchoolListFormValues,
  initialSchoolConnectivityFormValues,
  initialSchoolListFormValues,
} from "@/types/qos";

interface StoreState {
  stepIndex: number;
  columnMapping: Record<string, string>;
  schoolList: SchoolListFormValues;
  schoolConnectivity: SchoolConnectivityFormValues;
}
interface StoreActions {
  setSchoolListFormValues: (formValues: SchoolListFormValues) => void;
  setColumnMapping: (columnMapping: Record<string, string>) => void;
  setSchoolConnectivityFormValues: (
    formValues: SchoolConnectivityFormValues,
  ) => void;
  incrementStepIndex: () => void;
  decrementStepIndex: () => void;
  resetQosState: () => void;
  resetSchoolListFormValues: () => void;
  resetColumnMapping: () => void;
  resetSchoolConnectivityFormValues: () => void;
}

const initialState: StoreState = {
  stepIndex: 0,
  columnMapping: {},
  schoolList: initialSchoolListFormValues,
  schoolConnectivity: initialSchoolConnectivityFormValues,
};

export const useQosStore = create<StoreState & StoreActions>()(
  immer(
    devtools(
      set => ({
        ...initialState,
        setSchoolListFormValues: (formValues: SchoolListFormValues) =>
          set(state => {
            state.schoolList = formValues;
          }),
        setColumnMapping: (columnMapping: Record<string, string>) =>
          set(state => {
            state.columnMapping = columnMapping;
          }),
        setSchoolConnectivityFormValues: (
          formValues: SchoolConnectivityFormValues,
        ) =>
          set(state => {
            state.schoolConnectivity = formValues;
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
            state.schoolConnectivity = initialSchoolConnectivityFormValues;
          }),
        resetSchoolListFormValues: () =>
          set(state => {
            state.schoolList = initialSchoolListFormValues;
          }),
        resetColumnMapping: () =>
          set(state => {
            state.columnMapping = {};
          }),
        resetSchoolConnectivityFormValues: () =>
          set(state => {
            state.schoolConnectivity = initialSchoolConnectivityFormValues;
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
