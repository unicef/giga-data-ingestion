import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import {
  AuthorizationTypeEnum,
  PaginationTypeEnum,
  RequestMethodEnum,
  SchoolListResponse,
  SendQueryInEnum,
} from "@/types/qos";

// interface UploadSlice {
//   file: File | null;
//   timestamp: Date | null;
//   uploadId: string;
//   uploadDate: string;
// }

interface AppState {
  schoolList: SchoolListResponse;
  // fullPageLoading: boolean;
  // upload: UploadSlice;
}

interface AppActions {
  setSchoolList: (schoolList: SchoolListResponse) => void;
  // setFullPageLoading: (loading: boolean) => void;
  // setUpload: (upload: UploadSlice) => void;
  // resetUploadState: () => void;
}

// const initialUploadState: UploadSlice = {
//   file: null,
//   timestamp: null,
//   uploadId: "",
//   uploadDate: "",
// };

const initialState: AppState = {
  schoolList: {
    id: "",
    api_auth_api_key: "",
    api_auth_api_value: "",
    api_endpoint: "",
    authorization_type: AuthorizationTypeEnum.API_KEY,
    basic_auth_password: "",
    basic_auth_username: "",
    bearer_auth_bearer_token: "",
    data_key: "",
    date_created: new Date(),
    date_modified: new Date(),
    enabled: true,
    name: "",
    page_number_key: "",
    page_offset_key: "",
    page_size_key: "",
    page_starts_with: 1,
    pagination_type: PaginationTypeEnum.LIMIT_OFFSET,
    query_parameters: "",
    request_body: "",
    request_method: RequestMethodEnum.GET,
    school_id_key: "",
    send_query_in: SendQueryInEnum.BODY,
    size: 1,
    status: true,
    user_email: "",
    user_id: "",
  },
  // user: {
  //   name: "",
  //   email: "",
  //   roles: [],
  // },
  // fullPageLoading: true,
  // upload: initialUploadState,
};

export const useQosStore = create<AppState & AppActions>()(
  immer(
    devtools(
      set => ({
        ...initialState,
        setSchoolList: (schoolList: SchoolListResponse) =>
          set(state => {
            state.schoolList = schoolList;
          }),
        // setFullPageLoading: (loading: boolean) =>
        //   set(state => {
        //     state.fullPageLoading = loading;
        //   }),
        // setUpload: (upload: UploadSlice) =>
        //   set(state => {
        //     state.upload = upload;
        //   }),
        // resetUploadState: () =>
        //   set(state => {
        //     state.upload = initialUploadState;
        //   }),
      }),
      {
        enabled: !import.meta.env.PROD,
        name: "ingestionPortalState",
        anonymousActionType: "zustand/action",
      },
    ),
  ),
);
