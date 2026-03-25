export const FIELD_FORMAT_INFO: Record<
  string,
  { type: string; examples?: string }
> = {
  // ── School profile ──────────────────────────────────────────────────
  school_id_giga: { type: "string" },
  school_id_govt: { type: "string" },
  school_id_govt_type: {
    type: "string",
    examples: 'e.g., "EMIS", "Examination Board"',
  },
  school_name: { type: "string" },
  latitude: { type: "float" },
  longitude: { type: "float" },
  source_lat_lon: { type: "string" },
  school_address: { type: "string" },
  education_level: {
    type: "string",
    examples: 'e.g., "Primary", "Secondary", "Post-Secondary"',
  },
  education_level_govt: {
    type: "string",
    examples: 'e.g., "Primary", "Secondary"',
  },
  school_establishment_year: { type: "integer", examples: "e.g., 1995" },
  is_school_open: { type: "string", examples: '"Yes" or "No"' },
  school_area_type: { type: "string", examples: 'e.g., "Urban", "Rural"' },
  school_funding_type: {
    type: "string",
    examples: 'e.g., "Public", "Private"',
  },
  building_id_govt: { type: "string" },

  // ── School connectivity ─────────────────────────────────────────────
  connectivity: { type: "string", examples: 'e.g., "Yes", "No"' },
  connectivity_govt: { type: "string", examples: 'e.g., "Yes", "No"' },
  connectivity_type_govt: {
    type: "string",
    examples: 'e.g., "fiber", "satellite"',
  },
  connectivity_RT: { type: "string", examples: '"Yes" or "No"' },
  connectivity_RT_datasource: { type: "string" },
  connectivity_RT_ingestion_timestamp: { type: "string (ISO 8601)" },
  connectivity_govt_ingestion_timestamp: { type: "string (ISO 8601)" },
  connectivity_govt_collection_year: {
    type: "integer",
    examples: "e.g., 2023",
  },
  download_speed_govt: { type: "number", examples: "in Mbps" },
  download_speed_contracted: { type: "number", examples: "in Mbps" },
  download_speed_benchmark: { type: "number", examples: "in Mbps" },
  electricity_availability: { type: "string", examples: '"Yes" or "No"' },
  electricity_type: {
    type: "string",
    examples: 'e.g., "solar", "electrical grid"',
  },

  // ── School ICT resources ────────────────────────────────────────────
  computer_availability: { type: "string", examples: '"Yes" or "No"' },
  device_availability: { type: "string", examples: '"Yes" or "No"' },
  computer_lab: { type: "string", examples: '"Yes" or "No"' },
  num_computers: { type: "integer" },
  num_computers_desired: { type: "integer" },
  num_tablets: { type: "integer" },
  num_robotic_equipment: { type: "integer" },
  teachers_trained: { type: "integer" },
  computer_govt_collection_year: { type: "integer", examples: "e.g., 2023" },

  // ── School facilities ───────────────────────────────────────────────
  num_classrooms: { type: "integer" },
  num_latrines: { type: "integer" },
  water_availability: { type: "string", examples: '"Yes" or "No"' },
  refugee_camp: { type: "string", examples: '"Yes" or "No"' },
  num_schools_per_building: { type: "integer" },

  // ── Demographics ────────────────────────────────────────────────────
  num_students: { type: "integer" },
  num_teachers: { type: "integer" },
  num_adm_personnel: { type: "integer" },

  // ── Administrative regions ──────────────────────────────────────────
  admin1: { type: "string" },
  admin2: { type: "string" },
  admin1_id_giga: { type: "string" },
  admin2_id_giga: { type: "string" },
  disputed_region: { type: "string" },

  // ── Coverage / distance metrics ─────────────────────────────────────
  cellular_coverage_availability: { type: "string", examples: '"Yes" or "No"' },
  cellular_coverage_type: {
    type: "string",
    examples: 'e.g., "2G", "3G", "4G", "5G"',
  },
  fiber_node_distance: { type: "number", examples: "in km" },
  microwave_node_distance: { type: "number", examples: "in km" },
  nearest_LTE_distance: { type: "number", examples: "in km" },
  nearest_UMTS_distance: { type: "number", examples: "in km" },
  nearest_GSM_distance: { type: "number", examples: "in km" },
  nearest_NR_distance: { type: "number", examples: "in km" },
  nearest_school_distance: { type: "number", examples: "in km" },
  nearest_LTE_id: { type: "string" },
  nearest_UMTS_id: { type: "string" },
  nearest_GSM_id: { type: "string" },
  nearest_NR_id: { type: "string" },

  // ── Population / schools nearby ─────────────────────────────────────
  pop_within_1km: { type: "integer" },
  pop_within_2km: { type: "integer" },
  pop_within_3km: { type: "integer" },
  pop_within_10km: { type: "integer" },
  schools_within_1km: { type: "integer" },
  schools_within_2km: { type: "integer" },
  schools_within_3km: { type: "integer" },
  schools_within_10km: { type: "integer" },

  // ── Other / metadata ────────────────────────────────────────────────
  school_location_ingestion_timestamp: { type: "string (ISO 8601)" },
  school_data_collection_year: { type: "integer", examples: "e.g., 2023" },
  school_data_source: { type: "string" },
  school_data_collection_modality: { type: "string" },
  sustainable_business_model: { type: "string" },

  // ── System timestamps ───────────────────────────────────────────────
  created_at: { type: "string (ISO 8601)" },
  updated_at: { type: "string (ISO 8601)" },
  deleted_at: { type: "string or null" },
};
