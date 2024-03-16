export enum DataRelevanceEnum {
  Required,
  Important,
  Optional,
}

export interface MasterSchemaItem {
  description: string;
  data_relevance: DataRelevanceEnum;
}

export interface MasterSchema {
  school_id_giga: MasterSchemaItem;
  school_id_govt: MasterSchemaItem;
  school_name: MasterSchemaItem;
  latitude: MasterSchemaItem;
  longitude: MasterSchemaItem;
  education_level: MasterSchemaItem;
  school_location_ingestion_timestamp: MasterSchemaItem;
  school_data_collection_year: MasterSchemaItem;
  connectivity_govt: MasterSchemaItem;
  connectivity: MasterSchemaItem;
  download_speed_govt: MasterSchemaItem;
  download_speed_contracted: MasterSchemaItem;
  connectivity_govt_ingestion_timestamp: MasterSchemaItem;
  connectivity_govt_collection_year: MasterSchemaItem;
  connectivity_RT: MasterSchemaItem;
  connectivity_RT_datasource: MasterSchemaItem;
  connectivity_RT_ingestion_timestamp: MasterSchemaItem;
  connectivity_type_govt: MasterSchemaItem;
  admin1: MasterSchemaItem;
  admin2: MasterSchemaItem;
  disputed_region: MasterSchemaItem;
  school_area_type: MasterSchemaItem;
  school_establishment_year: MasterSchemaItem;
  school_funding_type: MasterSchemaItem;
  num_computers: MasterSchemaItem;
  num_computers_desired: MasterSchemaItem;
  num_teachers: MasterSchemaItem;
  num_adm_personnel: MasterSchemaItem;
  num_students: MasterSchemaItem;
  num_classrooms: MasterSchemaItem;
  num_latrines: MasterSchemaItem;
  computer_lab: MasterSchemaItem;
  electricity_availability: MasterSchemaItem;
  electricity_type: MasterSchemaItem;
  water_availability: MasterSchemaItem;
  school_data_source: MasterSchemaItem;
  school_data_collection_modality: MasterSchemaItem;
  cellular_coverage_availability: MasterSchemaItem;
  cellular_coverage_type: MasterSchemaItem;
  fiber_node_distance: MasterSchemaItem;
  microwave_node_distance: MasterSchemaItem;
  nearest_LTE_distance: MasterSchemaItem;
  nearest_UMTS_distance: MasterSchemaItem;
  nearest_GSM_distance: MasterSchemaItem;
  pop_within_1km: MasterSchemaItem;
  pop_within_2km: MasterSchemaItem;
  pop_within_3km: MasterSchemaItem;
  schools_within_1km: MasterSchemaItem;
  schools_within_2km: MasterSchemaItem;
  schools_within_3km: MasterSchemaItem;
  pop_within_10km: MasterSchemaItem;
  school_id_govt_type: MasterSchemaItem;
  education_level_govt: MasterSchemaItem;
  school_address: MasterSchemaItem;
  nearest_school_distance: MasterSchemaItem;
  schools_within_10km: MasterSchemaItem;
  nearest_LTE_id: MasterSchemaItem;
  nearest_UMTS_id: MasterSchemaItem;
  nearest_GSM_id: MasterSchemaItem;
  is_school_open: MasterSchemaItem;
}

export const masterSchemaData: MasterSchema = {
  school_id_giga: {
    description: "Unique Giga school ID.",
    data_relevance: DataRelevanceEnum.Required,
  },
  school_id_govt: {
    description:
      "Government school ID. Must be unique within country but can be duplicates across countries. ",
    data_relevance: DataRelevanceEnum.Required,
  },
  school_name: {
    description: "Name of the school",
    data_relevance: DataRelevanceEnum.Required,
  },
  latitude: {
    description: "Latitude coordinate of the school",
    data_relevance: DataRelevanceEnum.Required,
  },
  longitude: {
    description: "Longitude coordinate of the school",
    data_relevance: DataRelevanceEnum.Required,
  },
  education_level: {
    description:
      "Level of education taught at the school, standardized by Giga",
    data_relevance: DataRelevanceEnum.Required,
  },
  school_location_ingestion_timestamp: {
    description:
      "Timestamp when school locations were mapped/ingested in Giga system",
    data_relevance: DataRelevanceEnum.Required,
  },
  school_data_collection_year: {
    description:
      "Year when school name, location and key demographic indicators were last updated and/or collected ",
    data_relevance: DataRelevanceEnum.Optional,
  },
  connectivity_govt: {
    description: "Availability of connectivity at the school as per government",
    data_relevance: DataRelevanceEnum.Optional,
  },
  connectivity: {
    description:
      "Availability of connectivity at the school across our sources- government and real time mapping",
    data_relevance: DataRelevanceEnum.Optional,
  },
  download_speed_govt: {
    description:
      "Internet connectivity speed in mpbs as reported by the government, usually via school census or measured by enumerators on-site. ",
    data_relevance: DataRelevanceEnum.Optional,
  },
  download_speed_contracted: {
    description: "Internet connectivity speed contracted by the school in mpbs",
    data_relevance: DataRelevanceEnum.Optional,
  },
  connectivity_govt_ingestion_timestamp: {
    description:
      "Timestamp when we first ingested connectivity data from government in Giga system",
    data_relevance: DataRelevanceEnum.Optional,
  },
  connectivity_govt_collection_year: {
    description: "Year when government collected connectivity status",
    data_relevance: DataRelevanceEnum.Optional,
  },
  connectivity_RT: {
    description: "Whether we get realtime connectivity data for the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  connectivity_RT_datasource: {
    description: "Comma separated list of sources for connectivity data",
    data_relevance: DataRelevanceEnum.Optional,
  },
  connectivity_RT_ingestion_timestamp: {
    description:
      "Timestamp when we first ingested RT connectivity data in Giga system",
    data_relevance: DataRelevanceEnum.Optional,
  },
  connectivity_type_govt: {
    description: "Internet connectivity type",
    data_relevance: DataRelevanceEnum.Optional,
  },
  admin1: {
    description: "Admin level 1",
    data_relevance: DataRelevanceEnum.Required,
  },
  admin2: {
    description: "Admin level 2",
    data_relevance: DataRelevanceEnum.Required,
  },
  disputed_region: {
    description: "",
    data_relevance: DataRelevanceEnum.Optional,
  },
  school_area_type: {
    description: "School area type (urban or rural)",
    data_relevance: DataRelevanceEnum.Optional,
  },
  school_establishment_year: {
    description: "Year when school was established",
    data_relevance: DataRelevanceEnum.Optional,
  },
  school_funding_type: {
    description: "School type (public, private, charitable, others)",
    data_relevance: DataRelevanceEnum.Optional,
  },
  num_computers: {
    description: "Number of computers in the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  num_computers_desired: {
    description:
      "Number of desired computers in the school based on students count and national standards. ",
    data_relevance: DataRelevanceEnum.Optional,
  },
  num_teachers: {
    description: "Number of teachers in the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  num_adm_personnel: {
    description: "Number of administrative personnel in the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  num_students: {
    description: "Number of students in the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  num_classrooms: {
    description: "Number of classrooms in the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  num_latrines: {
    description: "Number of latrines in the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  computer_lab: {
    description:
      "Availability of a functional computer laboratory in the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  electricity_availability: {
    description: "Availability of electricity at the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  electricity_type: {
    description: "Type of electricity powering the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  water_availability: {
    description: "Availability and/or access to water at the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  school_data_source: {
    description:
      "Entity sharing and owning school dataset (such as Ministry of Education, Office of Statistics, other)",
    data_relevance: DataRelevanceEnum.Optional,
  },
  school_data_collection_modality: {
    description: "Type of data collection modality",
    data_relevance: DataRelevanceEnum.Optional,
  },
  cellular_coverage_availability: {
    description: "Whether the school has cellular network coverage",
    data_relevance: DataRelevanceEnum.Optional,
  },
  cellular_coverage_type: {
    description:
      "Highest generation of available cellular network coverage in the school area",
    data_relevance: DataRelevanceEnum.Optional,
  },
  fiber_node_distance: {
    description: "Distance from school to nearest fiber node",
    data_relevance: DataRelevanceEnum.Optional,
  },
  microwave_node_distance: {
    description: "Distance from school to nearest microwave node",
    data_relevance: DataRelevanceEnum.Optional,
  },
  nearest_LTE_distance: {
    description: "The distance to the nearest LTE tower",
    data_relevance: DataRelevanceEnum.Optional,
  },
  nearest_UMTS_distance: {
    description: "The distance to the nearest UMTS tower",
    data_relevance: DataRelevanceEnum.Optional,
  },
  nearest_GSM_distance: {
    description: "The distance to the nearest GSM tower",
    data_relevance: DataRelevanceEnum.Optional,
  },
  pop_within_1km: {
    description: "Population within 1km of the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  pop_within_2km: {
    description: "Population within 2km of the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  pop_within_3km: {
    description: "Population within 3km of the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  schools_within_1km: {
    description: "Number of schools within 1km of the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  schools_within_2km: {
    description: "Number of schools within 2km of the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  schools_within_3km: {
    description: "Number of schools within 3km of the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  pop_within_10km: {
    description: "Population within 10km of the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  school_id_govt_type: {
    description:
      "Government school ID type provided by the government (EMIS, Examination Board, Other)",
    data_relevance: DataRelevanceEnum.Optional,
  },
  education_level_govt: {
    description:
      "Level of education taught at the school reported by the gov / data source. ",
    data_relevance: DataRelevanceEnum.Optional,
  },
  school_address: {
    description: "School address",
    data_relevance: DataRelevanceEnum.Optional,
  },
  nearest_school_distance: {
    description: "Distance to the next nearest school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  schools_within_10km: {
    description: "Number of schools within 10km of the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  nearest_LTE_id: {
    description: "The ID of the nearest LTE tower",
    data_relevance: DataRelevanceEnum.Optional,
  },
  nearest_UMTS_id: {
    description: "The ID of the nearest UMTS tower",
    data_relevance: DataRelevanceEnum.Optional,
  },
  nearest_GSM_id: {
    description: "The ID of the nearest GSM tower",
    data_relevance: DataRelevanceEnum.Optional,
  },
  is_school_open: {
    description: "Whether school is open or closed",
    data_relevance: DataRelevanceEnum.Optional,
  },
};

export interface CoverageSchema
  extends Pick<
    MasterSchema,
    | "school_id_giga"
    | "cellular_coverage_availability"
    | "cellular_coverage_type"
    | "fiber_node_distance"
    | "microwave_node_distance"
    | "schools_within_1km"
    | "schools_within_2km"
    | "schools_within_3km"
    | "nearest_LTE_distance"
    | "nearest_UMTS_distance"
    | "nearest_GSM_distance"
    | "pop_within_1km"
    | "pop_within_2km"
    | "pop_within_3km"
    | "pop_within_10km"
    | "nearest_school_distance"
    | "schools_within_10km"
    | "nearest_LTE_id"
    | "nearest_UMTS_id"
    | "nearest_GSM_id"
  > {
  nearest_NR_distance: MasterSchemaItem;
  nearest_NR_id: MasterSchemaItem;
}

export const coverageSchemaData: CoverageSchema = {
  school_id_giga: masterSchemaData.school_id_giga,
  cellular_coverage_availability:
    masterSchemaData.cellular_coverage_availability,
  cellular_coverage_type: masterSchemaData.cellular_coverage_type,
  fiber_node_distance: masterSchemaData.fiber_node_distance,
  microwave_node_distance: masterSchemaData.microwave_node_distance,
  schools_within_1km: masterSchemaData.schools_within_1km,
  schools_within_2km: masterSchemaData.schools_within_2km,
  schools_within_3km: masterSchemaData.schools_within_3km,
  nearest_LTE_distance: masterSchemaData.nearest_LTE_distance,
  nearest_UMTS_distance: masterSchemaData.nearest_UMTS_distance,
  nearest_GSM_distance: masterSchemaData.nearest_GSM_distance,
  pop_within_1km: masterSchemaData.pop_within_1km,
  pop_within_2km: masterSchemaData.pop_within_2km,
  pop_within_3km: masterSchemaData.pop_within_3km,
  pop_within_10km: masterSchemaData.pop_within_10km,
  nearest_school_distance: masterSchemaData.nearest_school_distance,
  schools_within_10km: masterSchemaData.schools_within_10km,
  nearest_LTE_id: masterSchemaData.nearest_LTE_id,
  nearest_UMTS_id: masterSchemaData.nearest_UMTS_id,
  nearest_GSM_id: masterSchemaData.nearest_GSM_id,
  nearest_NR_distance: {
    description: "NO_DESCRIPTION",
    data_relevance: DataRelevanceEnum.Optional,
  },
  nearest_NR_id: {
    description: "NO_DESCRIPTION",
    data_relevance: DataRelevanceEnum.Optional,
  },
};

export interface GeolocationSchema
  extends Pick<
    MasterSchema,
    | "admin1"
    | "admin2"
    | "computer_lab"
    | "connectivity_govt_collection_year"
    | "connectivity_govt_ingestion_timestamp"
    | "connectivity_govt"
    | "connectivity_type_govt"
    | "download_speed_contracted"
    | "download_speed_govt"
    | "education_level_govt"
    | "education_level"
    | "electricity_availability"
    | "electricity_type"
    | "is_school_open"
    | "latitude"
    | "longitude"
    | "num_adm_personnel"
    | "num_classrooms"
    | "num_computers_desired"
    | "num_computers"
    | "num_latrines"
    | "num_students"
    | "num_teachers"
    | "school_address"
    | "school_area_type"
    | "school_data_collection_modality"
    | "school_data_collection_year"
    | "school_data_source"
    | "school_establishment_year"
    | "school_funding_type"
    | "school_id_giga"
    | "school_id_govt_type"
    | "school_id_govt"
    | "school_location_ingestion_timestamp"
    | "school_name"
    | "water_availability"
  > {
  admin1_id_giga: MasterSchemaItem;
  admin2_id_giga: MasterSchemaItem;
}

export const geolocationSchemaData: GeolocationSchema = {
  admin1: masterSchemaData.admin1,
  admin2: masterSchemaData.admin2,
  computer_lab: masterSchemaData.computer_lab,
  connectivity_govt_collection_year:
    masterSchemaData.connectivity_govt_collection_year,
  connectivity_govt_ingestion_timestamp:
    masterSchemaData.connectivity_govt_ingestion_timestamp,
  connectivity_govt: masterSchemaData.connectivity_govt,
  connectivity_type_govt: masterSchemaData.connectivity_type_govt,
  download_speed_contracted: masterSchemaData.download_speed_contracted,
  download_speed_govt: masterSchemaData.download_speed_govt,
  education_level_govt: masterSchemaData.education_level_govt,
  education_level: masterSchemaData.education_level,
  electricity_availability: masterSchemaData.electricity_availability,
  electricity_type: masterSchemaData.electricity_type,
  is_school_open: masterSchemaData.is_school_open,
  latitude: masterSchemaData.latitude,
  longitude: masterSchemaData.longitude,
  num_adm_personnel: masterSchemaData.num_adm_personnel,
  num_classrooms: masterSchemaData.num_classrooms,
  num_computers_desired: masterSchemaData.num_computers_desired,
  num_computers: masterSchemaData.num_computers,
  num_latrines: masterSchemaData.num_latrines,
  num_students: masterSchemaData.num_students,
  num_teachers: masterSchemaData.num_teachers,
  school_address: masterSchemaData.school_address,
  school_area_type: masterSchemaData.school_area_type,
  school_data_collection_modality:
    masterSchemaData.school_data_collection_modality,
  school_data_collection_year: masterSchemaData.school_data_collection_year,
  school_data_source: masterSchemaData.school_data_source,
  school_establishment_year: masterSchemaData.school_establishment_year,
  school_funding_type: masterSchemaData.school_funding_type,
  school_id_giga: masterSchemaData.school_id_giga,
  school_id_govt_type: masterSchemaData.school_id_govt_type,
  school_id_govt: masterSchemaData.school_id_govt,
  school_location_ingestion_timestamp:
    masterSchemaData.school_location_ingestion_timestamp,
  school_name: masterSchemaData.school_name,
  water_availability: masterSchemaData.water_availability,
  admin1_id_giga: {
    description: "NO_DESCRIPTION",
    data_relevance: DataRelevanceEnum.Optional,
  },
  admin2_id_giga: {
    description: "NO_DESCRIPTION",
    data_relevance: DataRelevanceEnum.Optional,
  },
};
