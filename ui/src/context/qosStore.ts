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
  columnMapping: Record<string, string>;
  detectedColumns: string[];
  schoolList: SchoolListFormValues;
  schoolConnectivity: SchoolConnectivityFormValues;
  stepIndex: number;
  testButtonLoadingState: boolean;
  isValidTest: boolean;
}
interface StoreActions {
  setSchoolListFormValues: (formValues: SchoolListFormValues) => void;
  setColumnMapping: (columnMapping: Record<string, string>) => void;
  setSchoolConnectivityFormValues: (
    formValues: SchoolConnectivityFormValues,
  ) => void;
  setDetectedColumns: (detectedColumns: Array<string>) => void;
  setIsValidTest: (isValid: boolean) => void;

  incrementStepIndex: () => void;
  decrementStepIndex: () => void;
  resetQosState: () => void;
  resetSchoolListFormValues: () => void;
  resetColumnMapping: () => void;
  resetSchoolConnectivityFormValues: () => void;
}

const initialState: StoreState = {
  columnMapping: {},
  detectedColumns: [],
  schoolList: initialSchoolListFormValues,
  schoolConnectivity: initialSchoolConnectivityFormValues,
  stepIndex: 0,
  testButtonLoadingState: false,
  isValidTest: false,
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
        setDetectedColumns: (detectedColumns: Array<string>) =>
          set(state => {
            state.detectedColumns = detectedColumns;
          }),
        setSchoolConnectivityFormValues: (
          formValues: SchoolConnectivityFormValues,
        ) =>
          set(state => {
            state.schoolConnectivity = formValues;
          }),
        setTestButtonLoadingState: (isLoading: boolean) =>
          set(state => {
            state.testButtonLoadingState = isLoading;
          }),
        setIsValidTest: (isValid: boolean) =>
          set(state => {
            state.isValidTest = isValid;
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
            state.detectedColumns = [];
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
