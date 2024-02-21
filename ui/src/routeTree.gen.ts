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
import { Route as UserManagementUserAddImport } from './routes/user-management/user/add'
import { Route as UploadUploadGroupUploadTypeImport } from './routes/upload/$uploadGroup/$uploadType'
import { Route as IngestApiIngestionAddImport } from './routes/ingest-api/ingestion/add'
import { Route as UserManagementUserRevokeUserIdImport } from './routes/user-management/user/revoke.$userId'
import { Route as UserManagementUserEnableUserIdImport } from './routes/user-management/user/enable.$userId'
import { Route as UserManagementUserEditUserIdImport } from './routes/user-management/user/edit.$userId'
import { Route as UploadUploadGroupUploadTypeSuccessImport } from './routes/upload/$uploadGroup/$uploadType/success'
import { Route as UploadUploadGroupUploadTypeMetadataImport } from './routes/upload/$uploadGroup/$uploadType/metadata'
import { Route as IngestApiIngestionEditIngestionIdImport } from './routes/ingest-api/ingestion/edit.$ingestionId'

// Create Virtual Routes

const UserManagementLazyImport = createFileRoute('/user-management')()
const UploadLazyImport = createFileRoute('/upload')()
const IngestApiLazyImport = createFileRoute('/ingest-api')()
const UploadIndexLazyImport = createFileRoute('/upload/')()
const IngestApiIndexLazyImport = createFileRoute('/ingest-api/')()
const CheckFileUploadsIndexLazyImport = createFileRoute(
  '/check-file-uploads/',
)()
const CheckFileUploadsUploadIdIndexLazyImport = createFileRoute(
  '/check-file-uploads/$uploadId/',
)()
const UploadUploadGroupUploadTypeIndexLazyImport = createFileRoute(
  '/upload/$uploadGroup/$uploadType/',
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

const CheckFileUploadsIndexLazyRoute = CheckFileUploadsIndexLazyImport.update({
  path: '/',
  getParentRoute: () => CheckFileUploadsRoute,
} as any).lazy(() =>
  import('./routes/check-file-uploads/index.lazy').then((d) => d.Route),
)

const CheckFileUploadsUploadIdIndexLazyRoute =
  CheckFileUploadsUploadIdIndexLazyImport.update({
    path: '/$uploadId/',
    getParentRoute: () => CheckFileUploadsRoute,
  } as any).lazy(() =>
    import('./routes/check-file-uploads/$uploadId/index.lazy').then(
      (d) => d.Route,
    ),
  )

const UserManagementUserAddRoute = UserManagementUserAddImport.update({
  path: '/user/add',
  getParentRoute: () => UserManagementLazyRoute,
} as any)

const UploadUploadGroupUploadTypeRoute =
  UploadUploadGroupUploadTypeImport.update({
    path: '/$uploadGroup/$uploadType',
    getParentRoute: () => UploadLazyRoute,
  } as any)

const IngestApiIngestionAddRoute = IngestApiIngestionAddImport.update({
  path: '/ingestion/add',
  getParentRoute: () => IngestApiLazyRoute,
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

const IngestApiIngestionEditIngestionIdRoute =
  IngestApiIngestionEditIngestionIdImport.update({
    path: '/ingestion/edit/$ingestionId',
    getParentRoute: () => IngestApiLazyRoute,
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
    '/check-file-uploads/': {
      preLoaderRoute: typeof CheckFileUploadsIndexLazyImport
      parentRoute: typeof CheckFileUploadsImport
    }
    '/ingest-api/': {
      preLoaderRoute: typeof IngestApiIndexLazyImport
      parentRoute: typeof IngestApiLazyImport
    }
    '/upload/': {
      preLoaderRoute: typeof UploadIndexLazyImport
      parentRoute: typeof UploadLazyImport
    }
    '/ingest-api/ingestion/add': {
      preLoaderRoute: typeof IngestApiIngestionAddImport
      parentRoute: typeof IngestApiLazyImport
    }
    '/upload/$uploadGroup/$uploadType': {
      preLoaderRoute: typeof UploadUploadGroupUploadTypeImport
      parentRoute: typeof UploadLazyImport
    }
    '/user-management/user/add': {
      preLoaderRoute: typeof UserManagementUserAddImport
      parentRoute: typeof UserManagementLazyImport
    }
    '/check-file-uploads/$uploadId/': {
      preLoaderRoute: typeof CheckFileUploadsUploadIdIndexLazyImport
      parentRoute: typeof CheckFileUploadsImport
    }
    '/ingest-api/ingestion/edit/$ingestionId': {
      preLoaderRoute: typeof IngestApiIngestionEditIngestionIdImport
      parentRoute: typeof IngestApiLazyImport
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
    '/upload/$uploadGroup/$uploadType/': {
      preLoaderRoute: typeof UploadUploadGroupUploadTypeIndexLazyImport
      parentRoute: typeof UploadUploadGroupUploadTypeImport
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  CheckFileUploadsRoute.addChildren([
    CheckFileUploadsIndexLazyRoute,
    CheckFileUploadsUploadIdIndexLazyRoute,
  ]),
  IngestApiLazyRoute.addChildren([
    IngestApiIndexLazyRoute,
    IngestApiIngestionAddRoute,
    IngestApiIngestionEditIngestionIdRoute,
  ]),
  UploadLazyRoute.addChildren([
    UploadIndexLazyRoute,
    UploadUploadGroupUploadTypeRoute.addChildren([
      UploadUploadGroupUploadTypeMetadataRoute,
      UploadUploadGroupUploadTypeSuccessRoute,
      UploadUploadGroupUploadTypeIndexLazyRoute,
    ]),
  ]),
  UserManagementLazyRoute.addChildren([
    UserManagementUserAddRoute,
    UserManagementUserEditUserIdRoute,
    UserManagementUserEnableUserIdRoute,
    UserManagementUserRevokeUserIdRoute,
  ]),
])

/* prettier-ignore-end */
