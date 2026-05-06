import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/upload/$uploadGroup/$uploadType/column-mapping')({
  component: () => <div>Hello /upload/$uploadGroup/$uploadType/column-mapping!</div>
})