CREATE TABLE IF NOT EXISTS `${schema_name}`.`${table_name}` (
  request_method STRING NOT NULL, # ENUM GET/POST
  api_endpoint STRING NOT NULL,
  data_key STRING,
  school_id_key STRING NOT NULL,

  query_parameters STRING, # will need to rely on frontend to validate that keys and values exist
  authorization_type STRING, # ENUM BEARER_TOKEN/BASIC_AUTH/API_KEY/NULL
  bearer_auth_bearer_token STRING, # NOT NULL if authorization_type == BEARER_TOKEN
  basic_auth_username STRING, # NOT NULL if authorization_type == BASIC_AUTH
  basic_auth_password STRING, # NOT NULL if authorization_type == BASIC_AUTH
  api_auth_api_key STRING, # NOT NULL if authorization_type == API_KEY
  api_auth_api_value STRING, # NOT NULL if authorization_type == API_KEY

  paginated STRING, # ENUM PAGE_NUMBER/LIMIT_OFFSET/NULL
  size INT, # NOT NULL if paginated == PAGE_NUMBER/LIMIT_OFFSET
  page_size_key STRING, # NOT NULL if paginated == PAGE_NUMBER/LIMIT_OFFSET
  send_query_in STRING, # ENUM BODY/QUERY_PARAMETERS/HEADERS, # NOT NULL if paginated == PAGE_NUMBER/LIMIT_OFFSET

  page_number_key STRING, # NOT NULL if paginated == PAGE_NUMBER
  page_starts_with INT, # NOT NULL if paginated == PAGE_NUMBER

  page_offset_key STRING, # NOT NULL if paginated == LIMIT_OFFSET
)
