import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import {
  type ApiIngestionSlice,
  createApiIngestionSlice,
} from "./slices/apiIngestionSlice";
import { type AppStateSlice, createAppStateSlice } from "./slices/appStateSlice";
import { type ApproveRowSlice, createApproveRowSlice } from "./slices/approveRowSlice";
import { type UploadSlice, createUploadSlice } from "./slices/uploadSlice";

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
