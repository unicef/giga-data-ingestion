import io

import pandas as pd
from data_ingestion.utils.data_quality import basic_checks_csv


def _check(assertion: str, column: str) -> dict:
    return {
        "assertion": assertion,
        "column": column,
        "description": f"{assertion} on {column}",
        "count_failed": 1,
        "count_passed": 9,
        "count_overall": 10,
    }


# Object keys of the dq_summary are not check sections and must not break the CSV.
def test_basic_checks_csv_skips_non_list_keys():
    dq_summary = {
        "summary": {"rows": 10, "columns": 5},
        "critical_error_check": [_check("is_null_mandatory", "school_id_govt")],
        "duplicate_checks": [_check("duplicate", "school_id_govt")],
        "column_pass_summary": {"school_id_govt": {"passed": 9, "checks": {}}},
        "valueMaps": {"education": [{"src": "a", "dst": "b"}]},
        "dq_report": {
            "version": 1,
            "entity": "schools",
            "rejected": [{"key": "ids", "label": "School IDs", "rows": []}],
            "warnings": [],
        },
    }

    df = pd.read_csv(io.StringIO(basic_checks_csv(dq_summary)))

    assert list(df.columns) == ["column", "assertion", "description"]
    assert df.to_dict(orient="records") == [
        {
            "column": "school_id_govt",
            "assertion": "duplicate",
            "description": "duplicate on school_id_govt",
        },
        {
            "column": "school_id_govt",
            "assertion": "is_null_mandatory",
            "description": "is_null_mandatory on school_id_govt",
        },
    ]


def test_basic_checks_csv_with_no_checks_has_only_header():
    assert basic_checks_csv({"summary": {"rows": 0}}).strip() == (
        "column,assertion,description"
    )
