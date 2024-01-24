from pydantic import BaseModel


class UploadFileMetadata(BaseModel):
    sensitivity_level: str
    pii_classification: str
    geolocation_data_source: str
    data_collection_modality: str
    domain: str
    date_modified: str
    source: str
    data_owner: str
    country: str
    school_id_type: str
    description_file_update: str
