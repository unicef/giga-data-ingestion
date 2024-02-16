/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as UserManagementImport } from './routes/user-management'
import { Route as UploadImport } from './routes/upload'
import { Route as IngestApiImport } from './routes/ingest-api'
import { Route as IndexImport } from './routes/index'
import { Route as UploadUploadGroupUploadTypeImport } from './routes/upload/$uploadGroup/$uploadType'
import { Route as UploadUploadGroupUploadTypeSuccessImport } from './routes/upload/$uploadGroup/$uploadType/success'
import { Route as UploadUploadGroupUploadTypeMetadataImport } from './routes/upload/$uploadGroup/$uploadType/metadata'

// Create Virtual Routes

const UserManagementIndexLazyImport = createFileRoute('/user-management/')()
const UploadIndexLazyImport = createFileRoute('/upload/')()
const IngestApiIndexLazyImport = createFileRoute('/ingest-api/')()
const UploadUploadGroupUploadTypeIndexLazyImport = createFileRoute(
  '/upload/$uploadGroup/$uploadType/',
)()

// Create/Update Routes

const UserManagementRoute = UserManagementImport.update({
  path: '/user-management',
  getParentRoute: () => rootRoute,
} as any)

const UploadRoute = UploadImport.update({
  path: '/upload',
  getParentRoute: () => rootRoute,
} as any)

const IngestApiRoute = IngestApiImport.update({
  path: '/ingest-api',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const UserManagementIndexLazyRoute = UserManagementIndexLazyImport.update({
  path: '/',
  getParentRoute: () => UserManagementRoute,
} as any).lazy(() =>
  import('./routes/user-management/index.lazy').then((d) => d.Route),
)

const UploadIndexLazyRoute = UploadIndexLazyImport.update({
  path: '/',
  getParentRoute: () => UploadRoute,
} as any).lazy(() => import('./routes/upload/index.lazy').then((d) => d.Route))

const IngestApiIndexLazyRoute = IngestApiIndexLazyImport.update({
  path: '/',
  getParentRoute: () => IngestApiRoute,
} as any).lazy(() =>
  import('./routes/ingest-api/index.lazy').then((d) => d.Route),
)

const UploadUploadGroupUploadTypeRoute =
  UploadUploadGroupUploadTypeImport.update({
    path: '/$uploadGroup/$uploadType',
    getParentRoute: () => UploadRoute,
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

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/ingest-api': {
      preLoaderRoute: typeof IngestApiImport
      parentRoute: typeof rootRoute
    }
    '/upload': {
      preLoaderRoute: typeof UploadImport
      parentRoute: typeof rootRoute
    }
    '/user-management': {
      preLoaderRoute: typeof UserManagementImport
      parentRoute: typeof rootRoute
    }
    '/ingest-api/': {
      preLoaderRoute: typeof IngestApiIndexLazyImport
      parentRoute: typeof IngestApiImport
    }
    '/upload/': {
      preLoaderRoute: typeof UploadIndexLazyImport
      parentRoute: typeof UploadImport
    }
    '/user-management/': {
      preLoaderRoute: typeof UserManagementIndexLazyImport
      parentRoute: typeof UserManagementImport
    }
    '/upload/$uploadGroup/$uploadType': {
      preLoaderRoute: typeof UploadUploadGroupUploadTypeImport
      parentRoute: typeof UploadImport
    }
    '/upload/$uploadGroup/$uploadType/metadata': {
      preLoaderRoute: typeof UploadUploadGroupUploadTypeMetadataImport
      parentRoute: typeof UploadUploadGroupUploadTypeImport
    }
    '/upload/$uploadGroup/$uploadType/success': {
      preLoaderRoute: typeof UploadUploadGroupUploadTypeSuccessImport
      parentRoute: typeof UploadUploadGroupUploadTypeImport
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
  IngestApiRoute.addChildren([IngestApiIndexLazyRoute]),
  UploadRoute.addChildren([
    UploadIndexLazyRoute,
    UploadUploadGroupUploadTypeRoute.addChildren([
      UploadUploadGroupUploadTypeMetadataRoute,
      UploadUploadGroupUploadTypeSuccessRoute,
      UploadUploadGroupUploadTypeIndexLazyRoute,
    ]),
  ]),
  UserManagementRoute.addChildren([UserManagementIndexLazyRoute]),
])

/* prettier-ignore-end */
