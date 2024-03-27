export interface MetaSchema {
  id: string;
  name: string;
  data_type: string;
  is_nullable: boolean;
  is_important: boolean | null;
  is_system_generated: boolean | null;
  description: string | null;
  primary_key: boolean | null;
  partition_order: number | null;
  license: string | null;
  units: string | null;
  hint: string | null;
}
