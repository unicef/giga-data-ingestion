export interface MetaSchema {
  id: string;
  name: string;
  data_type: string;
  is_nullable: boolean;
  is_important: boolean | null;
  is_system_generated: boolean | null;
  description: string | null;
  primary_key: boolean | null;
  license: string | null;
  units: string | null;
  hint: string | null;
  // UI-only: mandatory only when creating new schools.
  is_create_required?: boolean;
  /** Schema-registry column group; drives mapping section headers. */
  column_group?: string | null;
}
