import pytest
from data_ingestion.utils.upload_impact import (
    build_upload_impact_preview,
    get_school_id_file_column,
    normalize_school_id,
)


# Duplicate rows include every row sharing a repeated ID, first occurrence too.
def test_upload_impact_preview_counts_all_rows_with_repeated_ids():
    preview = build_upload_impact_preview(
        file_school_ids=["A", "B", "B", "C"],
        total_rows=5,
        master_school_ids={"A", "C"},
    )

    assert preview["schools_to_update"] == 2
    assert preview["new_schools"] == 2
    assert preview["rows_with_school_id"] == 4
    assert preview["missing_school_id_rows"] == 1
    assert preview["unique_school_ids"] == 3
    # Both "B" rows are counted, not just the surplus one.
    assert preview["duplicate_school_id_rows"] == 2


# School IDs should be compared after trimming blanks and ignoring empty values.
def test_normalize_school_id_strips_empty_and_null_values():
    assert normalize_school_id("  BR-001  ") == "BR-001"
    assert normalize_school_id("") is None
    assert normalize_school_id("   ") is None
    assert normalize_school_id(None) is None


# The upload mapping is file-column to schema-column, so return the file column.
def test_get_school_id_file_column_uses_file_to_schema_mapping():
    assert (
        get_school_id_file_column(
            {
                "school_id_gov": "school_id_govt",
                "school_name": "official_school_name",
            }
        )
        == "school_id_gov"
    )


# The impact preview cannot run unless the user maps a column to school_id_govt.
def test_get_school_id_file_column_requires_school_id_mapping():
    with pytest.raises(ValueError) as exc_info:
        get_school_id_file_column({"school_name": "official_school_name"})

    assert str(exc_info.value) == "Column mapping must include school_id_govt."
