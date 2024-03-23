/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as CheckFileUploadsImport } from './routes/check-file-uploads'
import { Route as IndexImport } from './routes/index'
import { Route as ApprovalRequestsIndexImport } from './routes/approval-requests/index'
import { Route as IngestApiEditImport } from './routes/ingest-api/edit'
import { Route as IngestApiAddImport } from './routes/ingest-api/add'
import { Route as ApprovalRequestsSubpathIndexImport } from './routes/approval-requests/$subpath/index'
import { Route as UserManagementUserAddImport } from './routes/user-management/user/add'
import { Route as UploadUploadGroupUploadTypeImport } from './routes/upload/$uploadGroup/$uploadType'
import { Route as IngestApiAddSchoolConnectivityImport } from './routes/ingest-api/add/school-connectivity'
import { Route as IngestApiAddColumnMappingImport } from './routes/ingest-api/add/column-mapping'
import { Route as ApprovalRequestsSubpathConfirmImport } from './routes/approval-requests/$subpath/confirm'
import { Route as UserManagementUserRevokeUserIdImport } from './routes/user-management/user/revoke.$userId'
import { Route as UserManagementUserEnableUserIdImport } from './routes/user-management/user/enable.$userId'
import { Route as UserManagementUserEditUserIdImport } from './routes/user-management/user/edit.$userId'
import { Route as UploadUploadGroupUploadTypeSuccessImport } from './routes/upload/$uploadGroup/$uploadType/success'
import { Route as UploadUploadGroupUploadTypeMetadataImport } from './routes/upload/$uploadGroup/$uploadType/metadata'
import { Route as UploadUploadGroupUploadTypeColumnMappingImport } from './routes/upload/$uploadGroup/$uploadType/column-mapping'
import { Route as IngestApiEditIngestionIdSchoolConnectivityImport } from './routes/ingest-api/edit/$ingestionId/school-connectivity'
import { Route as IngestApiEditIngestionIdColumnMappingImport } from './routes/ingest-api/edit/$ingestionId/column-mapping'

// Create Virtual Routes

const UserManagementLazyImport = createFileRoute('/user-management')()
const UploadLazyImport = createFileRoute('/upload')()
const IngestApiLazyImport = createFileRoute('/ingest-api')()
const ApprovalRequestsLazyImport = createFileRoute('/approval-requests')()
const UploadIndexLazyImport = createFileRoute('/upload/')()
const IngestApiIndexLazyImport = createFileRoute('/ingest-api/')()
const UploadUploadIdIndexLazyImport = createFileRoute('/upload/$uploadId/')()
const IngestApiAddIndexLazyImport = createFileRoute('/ingest-api/add/')()
const UploadUploadGroupUploadTypeIndexLazyImport = createFileRoute(
  '/upload/$uploadGroup/$uploadType/',
)()
const IngestApiEditIngestionIdIndexLazyImport = createFileRoute(
  '/ingest-api/edit/$ingestionId/',
)()

// Create/Update Routes

const UserManagementLazyRoute = UserManagementLazyImport.update({
  path: '/user-management',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/user-management.lazy').then((d) => d.Route),
)

const UploadLazyRoute = UploadLazyImport.update({
  path: '/upload',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/upload.lazy').then((d) => d.Route))

const IngestApiLazyRoute = IngestApiLazyImport.update({
  path: '/ingest-api',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/ingest-api.lazy').then((d) => d.Route))

const ApprovalRequestsLazyRoute = ApprovalRequestsLazyImport.update({
  path: '/approval-requests',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/approval-requests.lazy').then((d) => d.Route),
)

const CheckFileUploadsRoute = CheckFileUploadsImport.update({
  path: '/check-file-uploads',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const UploadIndexLazyRoute = UploadIndexLazyImport.update({
  path: '/',
  getParentRoute: () => UploadLazyRoute,
} as any).lazy(() => import('./routes/upload/index.lazy').then((d) => d.Route))

const IngestApiIndexLazyRoute = IngestApiIndexLazyImport.update({
  path: '/',
  getParentRoute: () => IngestApiLazyRoute,
} as any).lazy(() =>
  import('./routes/ingest-api/index.lazy').then((d) => d.Route),
)

const ApprovalRequestsIndexRoute = ApprovalRequestsIndexImport.update({
  path: '/',
  getParentRoute: () => ApprovalRequestsLazyRoute,
} as any)

const IngestApiEditRoute = IngestApiEditImport.update({
  path: '/edit',
  getParentRoute: () => IngestApiLazyRoute,
} as any)

const IngestApiAddRoute = IngestApiAddImport.update({
  path: '/add',
  getParentRoute: () => IngestApiLazyRoute,
} as any)

const UploadUploadIdIndexLazyRoute = UploadUploadIdIndexLazyImport.update({
  path: '/$uploadId/',
  getParentRoute: () => UploadLazyRoute,
} as any).lazy(() =>
  import('./routes/upload/$uploadId/index.lazy').then((d) => d.Route),
)

const IngestApiAddIndexLazyRoute = IngestApiAddIndexLazyImport.update({
  path: '/',
  getParentRoute: () => IngestApiAddRoute,
} as any).lazy(() =>
  import('./routes/ingest-api/add/index.lazy').then((d) => d.Route),
)

const ApprovalRequestsSubpathIndexRoute =
  ApprovalRequestsSubpathIndexImport.update({
    path: '/$subpath/',
    getParentRoute: () => ApprovalRequestsLazyRoute,
  } as any)

const UserManagementUserAddRoute = UserManagementUserAddImport.update({
  path: '/user/add',
  getParentRoute: () => UserManagementLazyRoute,
} as any)

const UploadUploadGroupUploadTypeRoute =
  UploadUploadGroupUploadTypeImport.update({
    path: '/$uploadGroup/$uploadType',
    getParentRoute: () => UploadLazyRoute,
  } as any)

const IngestApiAddSchoolConnectivityRoute =
  IngestApiAddSchoolConnectivityImport.update({
    path: '/school-connectivity',
    getParentRoute: () => IngestApiAddRoute,
  } as any)

const IngestApiAddColumnMappingRoute = IngestApiAddColumnMappingImport.update({
  path: '/column-mapping',
  getParentRoute: () => IngestApiAddRoute,
} as any)

const ApprovalRequestsSubpathConfirmRoute =
  ApprovalRequestsSubpathConfirmImport.update({
    path: '/$subpath/confirm',
    getParentRoute: () => ApprovalRequestsLazyRoute,
  } as any)

const UploadUploadGroupUploadTypeIndexLazyRoute =
  UploadUploadGroupUploadTypeIndexLazyImport.update({
    path: '/',
    getParentRoute: () => UploadUploadGroupUploadTypeRoute,
  } as any).lazy(() =>
    import('./routes/upload/$uploadGroup/$uploadType/index.lazy').then(
      (d) => d.Route,
    ),
  )

const IngestApiEditIngestionIdIndexLazyRoute =
  IngestApiEditIngestionIdIndexLazyImport.update({
    path: '/$ingestionId/',
    getParentRoute: () => IngestApiEditRoute,
  } as any).lazy(() =>
    import('./routes/ingest-api/edit/$ingestionId/index.lazy').then(
      (d) => d.Route,
    ),
  )

const UserManagementUserRevokeUserIdRoute =
  UserManagementUserRevokeUserIdImport.update({
    path: '/user/revoke/$userId',
    getParentRoute: () => UserManagementLazyRoute,
  } as any)

const UserManagementUserEnableUserIdRoute =
  UserManagementUserEnableUserIdImport.update({
    path: '/user/enable/$userId',
    getParentRoute: () => UserManagementLazyRoute,
  } as any)

const UserManagementUserEditUserIdRoute =
  UserManagementUserEditUserIdImport.update({
    path: '/user/edit/$userId',
    getParentRoute: () => UserManagementLazyRoute,
  } as any)

const UploadUploadGroupUploadTypeSuccessRoute =
  UploadUploadGroupUploadTypeSuccessImport.update({
    path: '/success',
    getParentRoute: () => UploadUploadGroupUploadTypeRoute,
  } as any)

const UploadUploadGroupUploadTypeMetadataRoute =
  UploadUploadGroupUploadTypeMetadataImport.update({
    path: '/metadata',
    getParentRoute: () => UploadUploadGroupUploadTypeRoute,
  } as any)

const UploadUploadGroupUploadTypeColumnMappingRoute =
  UploadUploadGroupUploadTypeColumnMappingImport.update({
    path: '/column-mapping',
    getParentRoute: () => UploadUploadGroupUploadTypeRoute,
  } as any)

const IngestApiEditIngestionIdSchoolConnectivityRoute =
  IngestApiEditIngestionIdSchoolConnectivityImport.update({
    path: '/$ingestionId/school-connectivity',
    getParentRoute: () => IngestApiEditRoute,
  } as any)

const IngestApiEditIngestionIdColumnMappingRoute =
  IngestApiEditIngestionIdColumnMappingImport.update({
    path: '/$ingestionId/column-mapping',
    getParentRoute: () => IngestApiEditRoute,
  } as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/check-file-uploads': {
      preLoaderRoute: typeof CheckFileUploadsImport
      parentRoute: typeof rootRoute
    }
    '/approval-requests': {
      preLoaderRoute: typeof ApprovalRequestsLazyImport
      parentRoute: typeof rootRoute
    }
    '/ingest-api': {
      preLoaderRoute: typeof IngestApiLazyImport
      parentRoute: typeof rootRoute
    }
    '/upload': {
      preLoaderRoute: typeof UploadLazyImport
      parentRoute: typeof rootRoute
    }
    '/user-management': {
      preLoaderRoute: typeof UserManagementLazyImport
      parentRoute: typeof rootRoute
    }
    '/ingest-api/add': {
      preLoaderRoute: typeof IngestApiAddImport
      parentRoute: typeof IngestApiLazyImport
    }
    '/ingest-api/edit': {
      preLoaderRoute: typeof IngestApiEditImport
      parentRoute: typeof IngestApiLazyImport
    }
    '/approval-requests/': {
      preLoaderRoute: typeof ApprovalRequestsIndexImport
      parentRoute: typeof ApprovalRequestsLazyImport
    }
    '/ingest-api/': {
      preLoaderRoute: typeof IngestApiIndexLazyImport
      parentRoute: typeof IngestApiLazyImport
    }
    '/upload/': {
      preLoaderRoute: typeof UploadIndexLazyImport
      parentRoute: typeof UploadLazyImport
    }
    '/approval-requests/$subpath/confirm': {
      preLoaderRoute: typeof ApprovalRequestsSubpathConfirmImport
      parentRoute: typeof ApprovalRequestsLazyImport
    }
    '/ingest-api/add/column-mapping': {
      preLoaderRoute: typeof IngestApiAddColumnMappingImport
      parentRoute: typeof IngestApiAddImport
    }
    '/ingest-api/add/school-connectivity': {
      preLoaderRoute: typeof IngestApiAddSchoolConnectivityImport
      parentRoute: typeof IngestApiAddImport
    }
    '/upload/$uploadGroup/$uploadType': {
      preLoaderRoute: typeof UploadUploadGroupUploadTypeImport
      parentRoute: typeof UploadLazyImport
    }
    '/user-management/user/add': {
      preLoaderRoute: typeof UserManagementUserAddImport
      parentRoute: typeof UserManagementLazyImport
    }
    '/approval-requests/$subpath/': {
      preLoaderRoute: typeof ApprovalRequestsSubpathIndexImport
      parentRoute: typeof ApprovalRequestsLazyImport
    }
    '/ingest-api/add/': {
      preLoaderRoute: typeof IngestApiAddIndexLazyImport
      parentRoute: typeof IngestApiAddImport
    }
    '/upload/$uploadId/': {
      preLoaderRoute: typeof UploadUploadIdIndexLazyImport
      parentRoute: typeof UploadLazyImport
    }
    '/ingest-api/edit/$ingestionId/column-mapping': {
      preLoaderRoute: typeof IngestApiEditIngestionIdColumnMappingImport
      parentRoute: typeof IngestApiEditImport
    }
    '/ingest-api/edit/$ingestionId/school-connectivity': {
      preLoaderRoute: typeof IngestApiEditIngestionIdSchoolConnectivityImport
      parentRoute: typeof IngestApiEditImport
    }
    '/upload/$uploadGroup/$uploadType/column-mapping': {
      preLoaderRoute: typeof UploadUploadGroupUploadTypeColumnMappingImport
      parentRoute: typeof UploadUploadGroupUploadTypeImport
    }
    '/upload/$uploadGroup/$uploadType/metadata': {
      preLoaderRoute: typeof UploadUploadGroupUploadTypeMetadataImport
      parentRoute: typeof UploadUploadGroupUploadTypeImport
    }
    '/upload/$uploadGroup/$uploadType/success': {
      preLoaderRoute: typeof UploadUploadGroupUploadTypeSuccessImport
      parentRoute: typeof UploadUploadGroupUploadTypeImport
    }
    '/user-management/user/edit/$userId': {
      preLoaderRoute: typeof UserManagementUserEditUserIdImport
      parentRoute: typeof UserManagementLazyImport
    }
    '/user-management/user/enable/$userId': {
      preLoaderRoute: typeof UserManagementUserEnableUserIdImport
      parentRoute: typeof UserManagementLazyImport
    }
    '/user-management/user/revoke/$userId': {
      preLoaderRoute: typeof UserManagementUserRevokeUserIdImport
      parentRoute: typeof UserManagementLazyImport
    }
    '/ingest-api/edit/$ingestionId/': {
      preLoaderRoute: typeof IngestApiEditIngestionIdIndexLazyImport
      parentRoute: typeof IngestApiEditImport
    }
    '/upload/$uploadGroup/$uploadType/': {
      preLoaderRoute: typeof UploadUploadGroupUploadTypeIndexLazyImport
      parentRoute: typeof UploadUploadGroupUploadTypeImport
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  CheckFileUploadsRoute,
  ApprovalRequestsLazyRoute.addChildren([
    ApprovalRequestsIndexRoute,
    ApprovalRequestsSubpathConfirmRoute,
    ApprovalRequestsSubpathIndexRoute,
  ]),
  IngestApiLazyRoute.addChildren([
    IngestApiAddRoute.addChildren([
      IngestApiAddColumnMappingRoute,
      IngestApiAddSchoolConnectivityRoute,
      IngestApiAddIndexLazyRoute,
    ]),
    IngestApiEditRoute.addChildren([
      IngestApiEditIngestionIdColumnMappingRoute,
      IngestApiEditIngestionIdSchoolConnectivityRoute,
      IngestApiEditIngestionIdIndexLazyRoute,
    ]),
    IngestApiIndexLazyRoute,
  ]),
  UploadLazyRoute.addChildren([
    UploadIndexLazyRoute,
    UploadUploadGroupUploadTypeRoute.addChildren([
      UploadUploadGroupUploadTypeColumnMappingRoute,
      UploadUploadGroupUploadTypeMetadataRoute,
      UploadUploadGroupUploadTypeSuccessRoute,
      UploadUploadGroupUploadTypeIndexLazyRoute,
    ]),
    UploadUploadIdIndexLazyRoute,
  ]),
  UserManagementLazyRoute.addChildren([
    UserManagementUserAddRoute,
    UserManagementUserEditUserIdRoute,
    UserManagementUserEnableUserIdRoute,
    UserManagementUserRevokeUserIdRoute,
  ]),
])

/* prettier-ignore-end */
