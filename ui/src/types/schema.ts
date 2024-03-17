export interface MetaSchema {
  name: string;
  data_type: string;
  is_nullable: boolean;
  description: string | null;
  primary_key: boolean | null;
  partition_order: number | null;
}
