import { StateCreator } from "zustand";

import {
  ConfigureColumnsForm,
  SchoolConnectivityFormSchema,
  SchoolListFormSchema,
  schoolConnectivityFormInitialValues,
  schoolListFormInitialValues,
} from "@/forms/ingestApi.ts";

export interface ApiIngestionSliceState {
  apiIngestionSlice: {
    columnMapping: ConfigureColumnsForm;
    detectedColumns: string[];
    schoolList: SchoolListFormSchema;
    schoolConnectivity: SchoolConnectivityFormSchema;
    stepIndex: number;
    file: File | null;
  };
}

export interface ApiIngestionSliceActions {
  apiIngestionSliceActions: {
    decrementStepIndex: () => void;
    incrementStepIndex: () => void;
    setStepIndex: (
      stepIndex: ApiIngestionSliceState["apiIngestionSlice"]["stepIndex"],
    ) => void;
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
    schoolList: schoolListFormInitialValues,
    schoolConnectivity: schoolConnectivityFormInitialValues,
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
    setStepIndex: stepIndex =>
      set(state => {
        state.apiIngestionSlice.stepIndex = stepIndex;
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
          schoolConnectivityFormInitialValues;
      }),
    resetSchoolListFormValues: () =>
      set(state => {
        state.apiIngestionSlice.schoolList = schoolListFormInitialValues;
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

        if (formValues.date_key === "")
          state.apiIngestionSlice.schoolConnectivity.date_key = null;
      }),
    setSchoolListFormValues: (formValues: SchoolListFormSchema) =>
      set(state => {
        state.apiIngestionSlice.schoolList = formValues;
      }),
  },
});
