import re

import pandas as pd
from rapidfuzz import fuzz, process, utils

from data_ingestion.settings import logger
from data_ingestion.utils.nocodb import (
    get_nocodb_table_id_from_name,
    get_nocodb_table_rows,
)

NOCODB_FUZZY_TABLES = {
    "education_level": "EducationLevelMapping",
    "connectivity_type": "ConnectivityTypeMapping",
    "school_area_type": "SchoolAreaTypeMapping",
    "electricity_type": "ElectricityTypeMapping",
    "learning_platform_type": "LearningPlatformTypeMapping",
}


def get_fuzzy_match_config_from_nocodb() -> dict[str, list[str]]:
    """
    Fetches exactly valid values for fuzzy matching from NocoDB.
    Returns a dictionary where keys are column names (e.g. 'education_level')
    and values are lists of valid strings.
    """
    config = {}
    try:
        for col_name, table_name in NOCODB_FUZZY_TABLES.items():
            try:
                table_id = get_nocodb_table_id_from_name(table_name)
                if not table_id:
                    continue
                target_column = "Giga"
                rows = get_nocodb_table_rows(table_id, fields=target_column)
                valid_values_raw = [
                    r.get(target_column) for r in rows if r.get(target_column)
                ]
                # Split entries that contain multiple values (e.g. "Primary, Secondary and Post-Secondary")
                valid_values = set()
                for val in valid_values_raw:
                    # Split by common delimiters: comma, semicolon, " and ", " & "
                    parts = re.split(
                        r",|;| and | & | And | AND ", str(val), flags=re.IGNORECASE
                    )
                    for p in parts:
                        cleaned = p.strip()
                        if cleaned:
                            valid_values.add(cleaned)

                valid_values = list(valid_values)
                if valid_values:
                    config[col_name] = valid_values
                else:
                    logger.warning(
                        f"No valid values found in NocoDB table {table_name} for {col_name}"
                    )
            except Exception as e:
                logger.warning(
                    f"Failed to fetch fuzzy match config for {col_name} from {table_name}: {e}"
                )
    except Exception as e:
        logger.error(f"Error connecting to NocoDB for fuzzy match config: {e}")

    return config


def fuzzy_match_value(val: str, valid_values: list[str], score_cutoff: float = 85.0):
    """
    Returns (suggested_value, was_changed)
    """
    if not val or not isinstance(val, str):
        return val, False

    result = process.extractOne(
        str(val),
        valid_values,
        scorer=fuzz.WRatio,
        score_cutoff=0,
        processor=utils.default_process,
    )

    if result:
        matched_val, score, _ = result
        if score >= score_cutoff:
            str_val = str(val).strip()
            was_changed = matched_val.lower() != str_val.lower()
            return matched_val, was_changed
        elif score < 50.0:
            return "Unknown", True

    return val, False


def _process_column_fuzzy_matching(
    value_counts: pd.Series, valid_values: list[str]
) -> tuple[list[dict], int]:
    errors_in_column = []
    total_unknown = 0

    for val, count in value_counts.items():
        is_null_or_nan = pd.isna(val)
        str_val = str(val).strip() if not is_null_or_nan else ""

        is_unknown_val = is_null_or_nan or str_val.lower() == "unknown" or str_val == ""

        if is_unknown_val:
            errors_in_column.append(
                {
                    "value_found": "null/nan/empty"
                    if not str_val and is_null_or_nan
                    else (str_val if str_val else "empty"),
                    "count": int(count),
                    "replace_with": "Unknown",
                    "is_valid": True,  # Disables UI dropdown
                }
            )
            total_unknown += int(count)
            continue

        # Check if exactly in valid values (case insensitive comparison)
        is_valid_exactly = False
        exact_match_str = None
        for v in valid_values:
            if str_val.lower() == v.strip().lower():
                is_valid_exactly = True
                exact_match_str = v
                break

        if is_valid_exactly:
            errors_in_column.append(
                {
                    "value_found": str_val,
                    "count": int(count),
                    "replace_with": exact_match_str,
                    "is_valid": True,
                }
            )
            continue

        # It's an unknown value. See if we can suggest a fuzzy replacement.
        suggested_val, was_changed = fuzzy_match_value(str_val, valid_values)

        # Whether we found a suggestion or not, it counts as an "error/unknown"
        errors_in_column.append(
            {
                "value_found": str_val,
                "count": int(count),
                "replace_with": suggested_val if was_changed else None,
                "is_valid": False,
            }
        )
        total_unknown += int(count)

    return errors_in_column, total_unknown


def run_fuzzy_matching(df: pd.DataFrame, column_mappings: dict[str, str]) -> dict:
    """

    Returns a dict matching the UI contract:
    {
      "columns": [
        {
          "schema_column": "education_level_govt",
          "file_column": "Educational_Level_Govt.",
          "header_title": "Educational_Level_Govt. (education_level_govt)",
          "unknown_count": 124,
          "dropdown_options": ["Primary", "Secondary"],
          "value_mappings": [
            { "value_found": "PRMARY", "count": 22, "replace_with": "Primary", "is_valid": False }
          ]
        }
      ]
    }
    """
    config = get_fuzzy_match_config_from_nocodb()
    columns_with_errors = []

    # column_mappings: "Raw_CSV_Col" -> "standard_col"
    # We want to check standardized columns (like "education_level_govt" -> targets "education_level" rules)

    for raw_col, standard_col in column_mappings.items():
        # Check if the standard config maps to a known fuzzy target, e.g. "education_level_govt" -> "education_level"
        fuzzy_target = None
        if standard_col in config:
            fuzzy_target = standard_col
        elif standard_col.replace("_govt", "") in config:
            fuzzy_target = standard_col.replace("_govt", "")

        if not fuzzy_target:
            continue

        valid_values = config[fuzzy_target]
        if raw_col not in df.columns:
            continue

        # Get unique values and their counts in the column
        value_counts = df[raw_col].value_counts(dropna=False)

        errors_in_column, total_unknown = _process_column_fuzzy_matching(
            value_counts, valid_values
        )

        if errors_in_column:
            # Sort errors_in_column: Invalid ones first, then valid ones
            errors_in_column.sort(key=lambda x: x["is_valid"])

            columns_with_errors.append(
                {
                    "schema_column": standard_col,
                    "file_column": raw_col,
                    "header_title": f"{raw_col} ({standard_col})",
                    "unknown_count": total_unknown,
                    "dropdown_options": sorted(valid_values),
                    "value_mappings": errors_in_column,
                }
            )

    return {"columns": columns_with_errors}
