export enum DataRelevanceEnum {
  Required,
  Important,
  Optional,
}

export interface SchoolDataItem {
  description: string;
  data_relevance: DataRelevanceEnum;
}

export interface ISchoolData {
  school_id_govt: SchoolDataItem;
  school_name: SchoolDataItem;
  education_level_govt: SchoolDataItem;
  latitude: SchoolDataItem;
  longitude: SchoolDataItem;
  school_id_govt_type: SchoolDataItem;
  school_funding_type: SchoolDataItem;
  school_establishment_year: SchoolDataItem;
  is_school_open: SchoolDataItem;
  school_area_type: SchoolDataItem;
  school_address: SchoolDataItem;
  connectivity_govt: SchoolDataItem;
  download_speed_govt: SchoolDataItem;
  download_speed_contracted: SchoolDataItem;
  connectivity_type_govt: SchoolDataItem;
  connectivity_govt_collection_year: SchoolDataItem;
  electricity_availability: SchoolDataItem;
  electricity_type: SchoolDataItem;
  computer_availability: SchoolDataItem;
  num_computers: SchoolDataItem;
  num_computers_desired: SchoolDataItem;
  computer_lab: SchoolDataItem;
  num_students: SchoolDataItem;
  num_teachers: SchoolDataItem;
  num_adm_personnel: SchoolDataItem;
  num_classrooms: SchoolDataItem;
  water_availability: SchoolDataItem;
  num_latrines: SchoolDataItem;
  school_data_source: SchoolDataItem;
  school_data_collection_year: SchoolDataItem;
  school_data_collection_modality: SchoolDataItem;
  refugee_camp: SchoolDataItem;
  student_refugees: SchoolDataItem;
  student_count_refugees: SchoolDataItem;
  student_count_girls: SchoolDataItem;
  student_count_boys: SchoolDataItem;
  student_count_other: SchoolDataItem;
}

export const schoolData: ISchoolData = {
  school_id_govt: {
    description:
      "Government school ID. Must be unique within country but can be duplicates across countries.",
    data_relevance: DataRelevanceEnum.Required,
  },
  school_name: {
    description: "Name of the school",
    data_relevance: DataRelevanceEnum.Required,
  },
  education_level_govt: {
    description: "Education level taught at the school",
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
  school_id_govt_type: {
    description:
      "Government school ID type provided by the government (EMIS, Examination Board, Other)",
    data_relevance: DataRelevanceEnum.Optional,
  },
  school_funding_type: {
    description: "School type (public, private, charitable, others)",
    data_relevance: DataRelevanceEnum.Optional,
  },
  school_establishment_year: {
    description: "Year when school was established",
    data_relevance: DataRelevanceEnum.Optional,
  },
  is_school_open: {
    description:
      "Whether school is open or closed to know if it is operational",
    data_relevance: DataRelevanceEnum.Optional,
  },
  school_area_type: {
    description: "School area type (urban or rural)",
    data_relevance: DataRelevanceEnum.Optional,
  },
  school_address: {
    description: "School address",
    data_relevance: DataRelevanceEnum.Optional,
  },
  connectivity_govt: {
    description:
      "Availability of connectivity at the school as per government records",
    data_relevance: DataRelevanceEnum.Important,
  },
  download_speed_govt: {
    description:
      "Internet connectivity speed in mpbs as reported by the government, usually via school census or measured by enumerators on-site.",
    data_relevance: DataRelevanceEnum.Optional,
  },
  download_speed_contracted: {
    description: "Internet connectivity speed contracted by the school in mpbs",
    data_relevance: DataRelevanceEnum.Important,
  },
  connectivity_type_govt: {
    description: "Internet connectivity type",
    data_relevance: DataRelevanceEnum.Optional,
  },
  connectivity_govt_collection_year: {
    description:
      "Year when government collected school connectivity status information",
    data_relevance: DataRelevanceEnum.Optional,
  },
  electricity_availability: {
    description: "Availability of electricity at the school",
    data_relevance: DataRelevanceEnum.Important,
  },
  electricity_type: {
    description: "Type of electricity powering the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  computer_availability: {
    description: "Availability of computer",
    data_relevance: DataRelevanceEnum.Important,
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
  computer_lab: {
    description:
      "Availability of a functional computer laboratory in the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  num_students: {
    description: "Number of students in the school",
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
  num_classrooms: {
    description: "Number of classrooms in the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  water_availability: {
    description: "Availability and/or access to water at the school",
    data_relevance: DataRelevanceEnum.Important,
  },
  num_latrines: {
    description: "Number of latrines in the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  school_data_source: {
    description:
      "Entity sharing and owning school dataset (such as Ministry of Education, Office of Statistics, other)",
    data_relevance: DataRelevanceEnum.Optional,
  },
  school_data_collection_year: {
    description:
      "Year when school name, location and key demographic indicators were last updated and/or collected ",
    data_relevance: DataRelevanceEnum.Optional,
  },
  school_data_collection_modality: {
    description: "Type of data collection modality",
    data_relevance: DataRelevanceEnum.Optional,
  },
  refugee_camp: {
    description: "Whether the school is located in a refugee camp ",
    data_relevance: DataRelevanceEnum.Optional,
  },
  student_refugees: {
    description:
      "Whether the school hosts refugee children and adolescents students",
    data_relevance: DataRelevanceEnum.Important,
  },

  student_count_refugees: {
    description:
      "Count of  refugee children and adolescents students in the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  student_count_girls: {
    description: "Count of girl students in the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  student_count_boys: {
    description: "Count of boys students in the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
  student_count_other: {
    description: "Count of other students in the school",
    data_relevance: DataRelevanceEnum.Optional,
  },
};
