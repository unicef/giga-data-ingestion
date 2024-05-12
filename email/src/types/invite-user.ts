import { z } from "zod";

export const InviteUserProps = z.object({
  displayName: z.string(),
  email: z.string().email(),
  groups: z.array(z.string()).nonempty(),
});

export type InviteUserProps = z.infer<typeof InviteUserProps>;
