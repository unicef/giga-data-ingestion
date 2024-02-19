import { z } from "zod";

export interface InviteUserProps {
  displayName: string;
  email: string;
  temporaryPassword: string;
  groups: string[];
}

export const InviteUserProps = z.object({
  displayName: z.string(),
  email: z.string().email(),
  temporaryPassword: z.string().min(8),
  groups: z.array(z.string()).nonempty(),
});
