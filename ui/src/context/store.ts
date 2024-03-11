import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import {
  ApiIngestionSlice,
  createApiIngestionSlice,
} from "./slices/apiIngestionSlice";
import { AppStateSlice, createAppStateSlice } from "./slices/appStateSlice";
import { UploadSlice, createUploadSlice } from "./slices/uploadSlice";

export const useStore = create<
  ApiIngestionSlice & AppStateSlice & UploadSlice
>()(
  immer(
    devtools(
      (...a) => ({
        ...createApiIngestionSlice(...a),
        ...createAppStateSlice(...a),
        ...createUploadSlice(...a),
      }),
      {
        enabled: !import.meta.env.PROD,
        name: "ingestionPortalState",
        anonymousActionType: "zustand/action",
      },
    ),
  ),
);

// export const useStore = create<AppState & AppActions>()(
//   immer(
//     devtools(
//       set => ({
//         ...initialState,
//         setUser: (user: User) =>
//           set(state => {
//             state.user = user;
//           }),
//         setFullPageLoading: (loading: boolean) =>
//           set(state => {
//             state.fullPageLoading = loading;
//           }),
//         setUpload: (upload: UploadSlice) =>
//           set(state => {
//             state.upload = upload;
//           }),
//         incrementStepIndex: () =>
//           set(state => {f
//             state.upload.stepIndex += 1;
//           }),
//         decrementStepIndex: () =>
//           set(state => {
//             state.upload.stepIndex -= 1;
//           }),
//         resetUploadState: () =>
//           set(state => {
//             state.upload = initialUploadState;
//           }),
//       }),
//       {
//         enabled: !import.meta.env.PROD,
//         name: "ingestionPortalState",
//         anonymousActionType: "zustand/action",
//       },
//     ),
//   ),
// );
