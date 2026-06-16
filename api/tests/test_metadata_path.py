from data_ingestion.utils.data_quality import get_metadata_path


def test_get_metadata_path_for_school_upload():
    upload_path = "raw/uploads/school-geolocation/FJI/abc.csv"
    assert (
        get_metadata_path(upload_path)
        == "raw/upload_metadata/school-geolocation/FJI/abc.csv.metadata.json"
    )


def test_get_metadata_path_for_health_upload():
    upload_path = (
        "updated_master_schema/health-master/FJI/FJI_fiji_health_20260525-160000.csv"
    )
    assert (
        get_metadata_path(upload_path) == "raw/upload_metadata/health-master/FJI/"
        "FJI_fiji_health_20260525-160000.csv.metadata.json"
    )
