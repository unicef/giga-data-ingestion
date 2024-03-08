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
  file: File | null;
}
interface StoreActions {
  setColumnMapping: (columnMapping: Record<string, string>) => void;
  setDetectedColumns: (detectedColumns: Array<string>) => void;
  setSchoolConnectivityFormValues: (
    formValues: SchoolConnectivityFormValues,
  ) => void;
  setSchoolListFormValues: (formValues: SchoolListFormValues) => void;
  setFile: (file: File | null) => void;

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
  file: null,
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
        setFile: (file: File | null) =>
          set(state => {
            state.file = file;
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
            state.file = null;
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
