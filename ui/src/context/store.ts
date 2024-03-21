import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import {
  ApiIngestionSlice,
  createApiIngestionSlice,
} from "./slices/apiIngestionSlice";
import { AppStateSlice, createAppStateSlice } from "./slices/appStateSlice";
import {
  ApproveRowSlice,
  createApproveRowSlice,
} from "./slices/approveRowSlice";
import { UploadSlice, createUploadSlice } from "./slices/uploadSlice";

export const useStore = create<
  ApiIngestionSlice & AppStateSlice & ApproveRowSlice & UploadSlice
>()(
  immer(
    devtools(
      (...a) => ({
        ...createApiIngestionSlice(...a),
        ...createAppStateSlice(...a),
        ...createUploadSlice(...a),
        ...createApproveRowSlice(...a),
      }),
      {
        enabled: !import.meta.env.PROD,
        name: "ingestionPortalState",
        anonymousActionType: "zustand/action",
      },
    ),
  ),
);
