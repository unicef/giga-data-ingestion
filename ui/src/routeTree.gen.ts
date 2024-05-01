/* eslint-disable */

/* prettier-ignore */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as UserManagementImport } from './routes/user-management'
import { Route as IndexImport } from './routes/index'
import { Route as UserManagementIndexImport } from './routes/user-management/index'
import { Route as UploadIndexImport } from './routes/upload/index'
import { Route as IngestApiIndexImport } from './routes/ingest-api/index'
import { Route as DeleteIndexImport } from './routes/delete/index'
import { Route as ApprovalRequestsIndexImport } from './routes/approval-requests/index'
import { Route as IngestApiEditImport } from './routes/ingest-api/edit'
import { Route as IngestApiAddImport } from './routes/ingest-api/add'
import { Route as UploadUploadIdIndexImport } from './routes/upload/$uploadId/index'
import { Route as IngestApiAddIndexImport } from './routes/ingest-api/add/index'
import { Route as DeleteCountryIndexImport } from './routes/delete/$country/index'
import { Route as ApprovalRequestsSubpathIndexImport } from './routes/approval-requests/$subpath/index'
import { Route as UserManagementUserAddImport } from './routes/user-management/user/add'
import { Route as UploadUploadGroupUploadTypeImport } from './routes/upload/$uploadGroup/$uploadType'
import { Route as IngestApiAddSchoolConnectivityImport } from './routes/ingest-api/add/school-connectivity'
import { Route as IngestApiAddColumnMappingImport } from './routes/ingest-api/add/column-mapping'
import { Route as ApprovalRequestsSubpathConfirmImport } from './routes/approval-requests/$subpath/confirm'
import { Route as UploadUploadGroupUploadTypeIndexImport } from './routes/upload/$uploadGroup/$uploadType/index'
import { Route as IngestApiEditIngestionIdIndexImport } from './routes/ingest-api/edit/$ingestionId/index'
import { Route as UserManagementUserRevokeUserIdImport } from './routes/user-management/user/revoke.$userId'
import { Route as UserManagementUserEnableUserIdImport } from './routes/user-management/user/enable.$userId'
import { Route as UserManagementUserEditUserIdImport } from './routes/user-management/user/edit.$userId'
import { Route as UploadUploadGroupUploadTypeSuccessImport } from './routes/upload/$uploadGroup/$uploadType/success'
import { Route as UploadUploadGroupUploadTypeMetadataImport } from './routes/upload/$uploadGroup/$uploadType/metadata'
import { Route as UploadUploadGroupUploadTypeColumnMappingImport } from './routes/upload/$uploadGroup/$uploadType/column-mapping'
import { Route as IngestApiEditIngestionIdSchoolConnectivityImport } from './routes/ingest-api/edit/$ingestionId/school-connectivity'
import { Route as IngestApiEditIngestionIdColumnMappingImport } from './routes/ingest-api/edit/$ingestionId/column-mapping'

// Create Virtual Routes

const UploadLazyImport = createFileRoute('/upload')()
const IngestApiLazyImport = createFileRoute('/ingest-api')()
const DeleteLazyImport = createFileRoute('/delete')()
const ApprovalRequestsLazyImport = createFileRoute('/approval-requests')()

// Create/Update Routes

const UploadLazyRoute = UploadLazyImport.update({
  path: '/upload',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/upload.lazy').then((d) => d.Route))

const IngestApiLazyRoute = IngestApiLazyImport.update({
  path: '/ingest-api',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/ingest-api.lazy').then((d) => d.Route))

const DeleteLazyRoute = DeleteLazyImport.update({
  path: '/delete',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/delete.lazy').then((d) => d.Route))

const ApprovalRequestsLazyRoute = ApprovalRequestsLazyImport.update({
  path: '/approval-requests',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/approval-requests.lazy').then((d) => d.Route),
)

const UserManagementRoute = UserManagementImport.update({
  path: '/user-management',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const UserManagementIndexRoute = UserManagementIndexImport.update({
  path: '/',
  getParentRoute: () => UserManagementRoute,
} as any)

const UploadIndexRoute = UploadIndexImport.update({
  path: '/',
  getParentRoute: () => UploadLazyRoute,
} as any)

const IngestApiIndexRoute = IngestApiIndexImport.update({
  path: '/',
  getParentRoute: () => IngestApiLazyRoute,
} as any)

const DeleteIndexRoute = DeleteIndexImport.update({
  path: '/',
  getParentRoute: () => DeleteLazyRoute,
} as any)

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

const UploadUploadIdIndexRoute = UploadUploadIdIndexImport.update({
  path: '/$uploadId/',
  getParentRoute: () => UploadLazyRoute,
} as any)

const IngestApiAddIndexRoute = IngestApiAddIndexImport.update({
  path: '/',
  getParentRoute: () => IngestApiAddRoute,
} as any)

const DeleteCountryIndexRoute = DeleteCountryIndexImport.update({
  path: '/$country/',
  getParentRoute: () => DeleteLazyRoute,
} as any)

const ApprovalRequestsSubpathIndexRoute =
  ApprovalRequestsSubpathIndexImport.update({
    path: '/$subpath/',
    getParentRoute: () => ApprovalRequestsLazyRoute,
  } as any)

const UserManagementUserAddRoute = UserManagementUserAddImport.update({
  path: '/user/add',
  getParentRoute: () => UserManagementRoute,
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

const UploadUploadGroupUploadTypeIndexRoute =
  UploadUploadGroupUploadTypeIndexImport.update({
    path: '/',
    getParentRoute: () => UploadUploadGroupUploadTypeRoute,
  } as any)

const IngestApiEditIngestionIdIndexRoute =
  IngestApiEditIngestionIdIndexImport.update({
    path: '/$ingestionId/',
    getParentRoute: () => IngestApiEditRoute,
  } as any)

const UserManagementUserRevokeUserIdRoute =
  UserManagementUserRevokeUserIdImport.update({
    path: '/user/revoke/$userId',
    getParentRoute: () => UserManagementRoute,
  } as any)

const UserManagementUserEnableUserIdRoute =
  UserManagementUserEnableUserIdImport.update({
    path: '/user/enable/$userId',
    getParentRoute: () => UserManagementRoute,
  } as any)

const UserManagementUserEditUserIdRoute =
  UserManagementUserEditUserIdImport.update({
    path: '/user/edit/$userId',
    getParentRoute: () => UserManagementRoute,
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
    '/user-management': {
      preLoaderRoute: typeof UserManagementImport
      parentRoute: typeof rootRoute
    }
    '/approval-requests': {
      preLoaderRoute: typeof ApprovalRequestsLazyImport
      parentRoute: typeof rootRoute
    }
    '/delete': {
      preLoaderRoute: typeof DeleteLazyImport
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
    '/delete/': {
      preLoaderRoute: typeof DeleteIndexImport
      parentRoute: typeof DeleteLazyImport
    }
    '/ingest-api/': {
      preLoaderRoute: typeof IngestApiIndexImport
      parentRoute: typeof IngestApiLazyImport
    }
    '/upload/': {
      preLoaderRoute: typeof UploadIndexImport
      parentRoute: typeof UploadLazyImport
    }
    '/user-management/': {
      preLoaderRoute: typeof UserManagementIndexImport
      parentRoute: typeof UserManagementImport
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
      parentRoute: typeof UserManagementImport
    }
    '/approval-requests/$subpath/': {
      preLoaderRoute: typeof ApprovalRequestsSubpathIndexImport
      parentRoute: typeof ApprovalRequestsLazyImport
    }
    '/delete/$country/': {
      preLoaderRoute: typeof DeleteCountryIndexImport
      parentRoute: typeof DeleteLazyImport
    }
    '/ingest-api/add/': {
      preLoaderRoute: typeof IngestApiAddIndexImport
      parentRoute: typeof IngestApiAddImport
    }
    '/upload/$uploadId/': {
      preLoaderRoute: typeof UploadUploadIdIndexImport
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
      parentRoute: typeof UserManagementImport
    }
    '/user-management/user/enable/$userId': {
      preLoaderRoute: typeof UserManagementUserEnableUserIdImport
      parentRoute: typeof UserManagementImport
    }
    '/user-management/user/revoke/$userId': {
      preLoaderRoute: typeof UserManagementUserRevokeUserIdImport
      parentRoute: typeof UserManagementImport
    }
    '/ingest-api/edit/$ingestionId/': {
      preLoaderRoute: typeof IngestApiEditIngestionIdIndexImport
      parentRoute: typeof IngestApiEditImport
    }
    '/upload/$uploadGroup/$uploadType/': {
      preLoaderRoute: typeof UploadUploadGroupUploadTypeIndexImport
      parentRoute: typeof UploadUploadGroupUploadTypeImport
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  UserManagementRoute.addChildren([
    UserManagementIndexRoute,
    UserManagementUserAddRoute,
    UserManagementUserEditUserIdRoute,
    UserManagementUserEnableUserIdRoute,
    UserManagementUserRevokeUserIdRoute,
  ]),
  ApprovalRequestsLazyRoute.addChildren([
    ApprovalRequestsIndexRoute,
    ApprovalRequestsSubpathConfirmRoute,
    ApprovalRequestsSubpathIndexRoute,
  ]),
  DeleteLazyRoute.addChildren([DeleteIndexRoute, DeleteCountryIndexRoute]),
  IngestApiLazyRoute.addChildren([
    IngestApiAddRoute.addChildren([
      IngestApiAddColumnMappingRoute,
      IngestApiAddSchoolConnectivityRoute,
      IngestApiAddIndexRoute,
    ]),
    IngestApiEditRoute.addChildren([
      IngestApiEditIngestionIdColumnMappingRoute,
      IngestApiEditIngestionIdSchoolConnectivityRoute,
      IngestApiEditIngestionIdIndexRoute,
    ]),
    IngestApiIndexRoute,
  ]),
  UploadLazyRoute.addChildren([
    UploadIndexRoute,
    UploadUploadGroupUploadTypeRoute.addChildren([
      UploadUploadGroupUploadTypeColumnMappingRoute,
      UploadUploadGroupUploadTypeMetadataRoute,
      UploadUploadGroupUploadTypeSuccessRoute,
      UploadUploadGroupUploadTypeIndexRoute,
    ]),
    UploadUploadIdIndexRoute,
  ]),
])
