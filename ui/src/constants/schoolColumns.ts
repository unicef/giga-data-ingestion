export const SCHOOL_COLUMN_CATEGORIES: Record<string, string> = {
  // School profile
  school_id_govt: "School profile",
  school_name: "School profile",
  latitude: "School profile",
  longitude: "School profile",
  education_level_govt: "School profile",
  source_lat_lon: "School profile",
  school_address: "School profile",
  school_establishment_year: "School profile",
  is_school_open: "School profile",
  school_area_type: "School profile",
  school_funding_type: "School profile",
  school_id_govt_type: "School profile",
  building_id_govt: "School profile",

  // School connectivity
  connectivity_govt: "School connectivity",
  connectivity_type_govt: "School connectivity",
  download_speed_contracted: "School connectivity",
  connectivity_govt_ingestion_timestamp: "School connectivity",
  electricity_availability: "School connectivity",
  electricity_type: "School connectivity",
  download_speed_govt: "School connectivity",
  download_speed_benchmark: "School connectivity",

  // School ICT resources
  computer_availability: "School ICT resources",
  device_availability: "School ICT resources",
  computer_lab: "School ICT resources",
  num_computers: "School ICT resources",
  num_tablets: "School ICT resources",
  num_computers_desired: "School ICT resources",
  teachers_trained: "School ICT resources",
  num_robotic_equipment: "School ICT resources",
  computer_govt_collection_year: "School ICT resources",

  // School facilities
  num_classrooms: "School Facilities",
  num_latrines: "School Facilities",
  water_availability: "School Facilities",
  refugee_camp: "School Facilities",
  num_schools_per_building: "School Facilities",

  // Other
  sustainable_business_model: "Other",

  // Other metadata
  school_data_collection_modality: "Other metadata",
  school_data_collection_year: "Other metadata",
  school_data_source: "Other metadata",
};

export const SCHOOL_CATEGORY_ORDER: string[] = [
  "School profile",
  "School connectivity",
  "School ICT resources",
  "School Facilities",
  "Other",
  "Other metadata",
];

// Always mandatory (also for updates).
export const REQUIRED_SCHOOL_COLUMNS = new Set<string>(["school_id_govt"]);

// Mandatory only to create new schools.
export const CREATE_REQUIRED_SCHOOL_COLUMNS = new Set<string>([
  "school_name",
  "latitude",
  "longitude",
  "education_level_govt",
]);

export const IMPORTANT_SCHOOL_COLUMNS = new Set<string>([
  "source_lat_lon",
  "connectivity_govt",
  "dowload_speed_contracted",
  "download_speed_contracted",
  "electricity_availability",
]);
