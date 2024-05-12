import { z } from "zod";

export const MasterDataReleaseNotificationProps = z.object({
  country: z.string(),
  added: z.number().int(),
  modified: z.number().int(),
  deleted: z.number().int(),
  updateDate: z.string(),
  version: z.number(),
  rows: z.number(),
});

export type MasterDataReleaseNotificationProps = z.infer<
  typeof MasterDataReleaseNotificationProps
>;
