import { z } from "zod";

export interface MasterDataReleaseNotificationProps {
  added: number;
  country: string;
  modified: number;
  name: string;
  updateDate: string;
  version: string;
  rows: number;
}

export const MasterDataReleaseNotificationProps = z.object({
  added: z.number(),
  country: z.string(),
  modified: z.number(),
  name: z.string(),
  updateDate: z.string(),
  version: z.string(),
  rows: z.number(),
});
