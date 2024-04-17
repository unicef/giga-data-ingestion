import { z } from "zod";

export interface MasterDataReleaseNotificationProps {
  added: number;
  country: string;
  modified: number;
  updateDate: string;
  version: number;
  rows: number;
}

export const MasterDataReleaseNotificationProps = z.object({
  added: z.number(),
  country: z.string(),
  modified: z.number(),
  updateDate: z.string(),
  version: z.number(),
  rows: z.number(),
});
