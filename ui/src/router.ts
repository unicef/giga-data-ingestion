// Generouted, changes to this file will be overriden
/* eslint-disable */

import { components, hooks, utils } from '@generouted/react-router/client'

export type Path =
  | `/`
  | `/datasources`
  | `/upload`
  | `/upload/:uploadGroup/:uploadType`
  | `/upload/:uploadGroup/:uploadType/metadata`
  | `/upload/:uploadGroup/:uploadType/success`
  | `/user-management`

export type Params = {
  '/upload/:uploadGroup/:uploadType': { uploadGroup: string; uploadType: string }
  '/upload/:uploadGroup/:uploadType/metadata': { uploadGroup: string; uploadType: string }
  '/upload/:uploadGroup/:uploadType/success': { uploadGroup: string; uploadType: string }
}

export type ModalPath = never

export const { Link, Navigate } = components<Path, Params>()
export const { useModals, useNavigate, useParams } = hooks<Path, Params, ModalPath>()
export const { redirect } = utils<Path, Params>()
