import { StateCreator } from "zustand";

import {
  ConfigureColumnsForm,
  SchoolListFormSchema,
} from "@/forms/ingestApi.ts";
import {
  SchoolConnectivityFormValues,
  initialSchoolConnectivityFormValues,
  initialSchoolListFormValues,
} from "@/types/qos";

export interface ApiIngestionSliceState {
  apiIngestionSlice: {
    columnMapping: ConfigureColumnsForm;
    detectedColumns: string[];
    schoolList: SchoolListFormSchema;
    schoolConnectivity: SchoolConnectivityFormValues;
    stepIndex: number;
    file: File | null;
  };
}

export interface ApiIngestionSliceActions {
  apiIngestionSliceActions: {
    decrementStepIndex: () => void;
    incrementStepIndex: () => void;
    resetColumnMapping: () => void;
    resetApiIngestionState: () => void;
    resetSchoolConnectivityFormValues: () => void;
    resetSchoolListFormValues: () => void;
    setColumnMapping: (
      columnMapping: ApiIngestionSliceState["apiIngestionSlice"]["columnMapping"],
    ) => void;
    setDetectedColumns: (
      detectedColumns: ApiIngestionSliceState["apiIngestionSlice"]["detectedColumns"],
    ) => void;
    setFile: (file: File | null) => void;
    setSchoolConnectivityFormValues: (
      formValues: ApiIngestionSliceState["apiIngestionSlice"]["schoolConnectivity"],
    ) => void;
    setSchoolListFormValues: (
      formValues: ApiIngestionSliceState["apiIngestionSlice"]["schoolList"],
    ) => void;
  };
}

export interface ApiIngestionSlice
  extends ApiIngestionSliceState,
    ApiIngestionSliceActions {}

export const initialApiIngestionSliceState: ApiIngestionSliceState = {
  apiIngestionSlice: {
    columnMapping: {},
    detectedColumns: [],
    schoolList: initialSchoolListFormValues,
    schoolConnectivity: initialSchoolConnectivityFormValues,
    stepIndex: 0,
    file: null,
  },
};

export const createApiIngestionSlice: StateCreator<
  ApiIngestionSlice,
  [["zustand/immer", never], never],
  [],
  ApiIngestionSlice
> = set => ({
  ...initialApiIngestionSliceState,

  apiIngestionSliceActions: {
    decrementStepIndex: () =>
      set(state => {
        state.apiIngestionSlice.stepIndex -= 1;
      }),
    incrementStepIndex: () =>
      set(state => {
        state.apiIngestionSlice.stepIndex += 1;
      }),
    resetColumnMapping: () =>
      set(state => {
        state.apiIngestionSlice.columnMapping = {};
      }),
    resetApiIngestionState: () =>
      set(state => {
        state.apiIngestionSlice = {
          ...initialApiIngestionSliceState.apiIngestionSlice,
        };
      }),
    resetSchoolConnectivityFormValues: () =>
      set(state => {
        state.apiIngestionSlice.schoolConnectivity =
          initialSchoolConnectivityFormValues;
      }),
    resetSchoolListFormValues: () =>
      set(state => {
        state.apiIngestionSlice.schoolList = initialSchoolListFormValues;
      }),
    setColumnMapping: columnMapping =>
      set(state => {
        state.apiIngestionSlice.columnMapping = columnMapping;
      }),
    setDetectedColumns: detectedColumns =>
      set(state => {
        state.apiIngestionSlice.detectedColumns = detectedColumns;
      }),
    setFile: (file: File | null) =>
      set(state => {
        state.apiIngestionSlice.file = file;
      }),
    setSchoolConnectivityFormValues: formValues =>
      set(state => {
        state.apiIngestionSlice.schoolConnectivity = formValues;
      }),
    setSchoolListFormValues: (formValues: SchoolListFormSchema) =>
      set(state => {
        state.apiIngestionSlice.schoolList = formValues;
      }),
  },
});
