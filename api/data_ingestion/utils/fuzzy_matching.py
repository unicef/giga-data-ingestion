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
UNKNOWN_VALUES = ("unknown", "nan", "none")
NULL_VAL_DISPLAY = ("nan", "none", "")


def extract_valid_values_from_rows(
    rows: list[dict], target_column: str, alias_column: str = "Govt"
) -> tuple[list[str], dict[str, str]]:
    """
    Helper to extract valid values.
    Returns (standardized_list, matching_map).
    matching_map: lower_case_alias/target -> StandardizedValue
    """
    standardized_list = []
    matching_map = {}

    for r in rows:
        giga_val = r.get(target_column)
        if not giga_val:
            continue

        giga_val_str = str(giga_val).strip()
        original_compound = giga_val_str

        matching_map[original_compound.lower()] = original_compound
        if original_compound.lower() not in [s.lower() for s in standardized_list]:
            standardized_list.append(original_compound)

        parts = re.split(
            r",|;| and | & | And | AND ", original_compound, flags=re.IGNORECASE
        )
        for p in parts:
            p_clean = p.strip()
            if p_clean:
                matching_map[p_clean.lower()] = p_clean
                if p_clean.lower() not in [s.lower() for s in standardized_list]:
                    standardized_list.append(p_clean)

        govt_val = r.get(alias_column)
        if govt_val:
            govt_val_str = str(govt_val).strip()
            matching_map[govt_val_str.lower()] = original_compound

    seen = set()
    final_std = []
    for s in standardized_list:
        if s.lower() not in seen:
            seen.add(s.lower())
            final_std.append(s)

    final_std.sort()

    return final_std, matching_map


def get_fuzzy_match_config_from_nocodb() -> dict[str, dict]:
    """
    Fetches exactly valid values for fuzzy matching from NocoDB.
    Returns a dictionary where keys are column names (e.g. 'education_level')
    and values are dicts containing 'dropdown_options' and 'matching_map'.
    """
    config = {}
    try:
        for col_name, table_name in NOCODB_FUZZY_TABLES.items():
            try:
                table_id = get_nocodb_table_id_from_name(table_name)
                if not table_id:
                    continue
                target_column = "Giga"
                alias_column = "Govt"
                rows = get_nocodb_table_rows(
                    table_id, fields=[target_column, alias_column]
                )
                dropdown_options, matching_map = extract_valid_values_from_rows(
                    rows, target_column, alias_column
                )

                if dropdown_options:
                    config[col_name] = {
                        "dropdown_options": dropdown_options,
                        "matching_map": matching_map,
                    }
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


def fuzzy_match_value(
    val: str, matching_map: dict[str, str], score_cutoff: float = 60.0
):
    """
    Returns (suggested_value, was_changed)
    Improved logic using token_sort_ratio and token_set_ratio to avoid shorter-string bias.
    """
    str_val = val.strip()

    # Pre-check: If 'unknown' is in the input string, automatically suggest 'Unknown'
    if "unknown" in str_val.lower():
        return "Unknown", True

    match_targets = list(matching_map.keys())

    match_targets.sort(key=len, reverse=True)

    # Pass 1: Use token_sort_ratio for overall string similarity
    results_sort = process.extract(
        str_val,
        match_targets,
        scorer=fuzz.token_sort_ratio,
        processor=utils.default_process,
        limit=5,
    )

    # Pass 2: Use token_set_ratio to find cases where tokens perfectly overlap
    results_set = process.extract(
        str_val,
        match_targets,
        scorer=fuzz.token_set_ratio,
        processor=utils.default_process,
        limit=5,
    )

    if not results_sort:
        return val, False

    best_sort_target, best_sort_score, _ = results_sort[0]
    best_set_target, best_set_score, _ = results_set[0]

    # Decision logic:
    # 1. If we have a very high token_sort_ratio (> 80), it's likely a match or a typo.
    if best_sort_score >= 80:
        matched_target = best_sort_target
        score = best_sort_score
    # 2. If token_set_ratio is perfect (100) and sort_ratio is decent (> 60),
    # it's likely a compound match or a specific subset.
    elif best_set_score == 100 and best_sort_score >= 60:
        matched_target = best_set_target
        score = best_set_score
    # 3. Fallback to the best sort match if it's above a safe threshold
    elif best_sort_score >= score_cutoff:
        matched_target = best_sort_target
        score = best_sort_score
    else:
        # If the best match is very weak, don't suggest it unless it's at least better than 50
        if best_sort_score < 50:
            return "Unknown", True
        return val, False

    suggested_val = matching_map[matched_target]
    was_changed = suggested_val.lower() != str_val.lower()

    logger.info(f"Fuzzy Match: '{str_val}' -> '{matched_target}' ({score:.2f}%)")
    return suggested_val, was_changed


def is_null_or_nan(val) -> bool:
    """Robust check for null/NaN/None across types."""
    if val is None:
        return True
    try:
        return pd.isna(val)
    except (TypeError, ValueError):
        return False


def process_column_fuzzy_matching(
    value_counts: pd.Series, valid_values: list[str], matching_map: dict[str, str]
) -> tuple[list[dict], int]:
    errors_in_column = []
    total_unknown = 0

    for val, count in value_counts.items():
        is_null = is_null_or_nan(val)
        str_val = str(val).strip() if not is_null else ""

        # Treat null/NaN/empty/"nan" string/"unknown" as locked Unknown
        is_unknown_val = is_null or str_val == "" or str_val.lower() in UNKNOWN_VALUES

        if is_unknown_val:
            # Determine display label
            if is_null or str_val.lower() in NULL_VAL_DISPLAY:
                display_val = "null/nan/empty"
            else:
                display_val = str_val

            errors_in_column.append(
                {
                    "value_found": display_val,
                    "count": int(count),
                    "replace_with": "Unknown",
                    "is_valid": True,  # Disables UI dropdown
                }
            )
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
        suggested_val, was_changed = fuzzy_match_value(str_val, matching_map)

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

        dropdown_opts = config[fuzzy_target]["dropdown_options"]
        matching_map = config[fuzzy_target]["matching_map"]
        if raw_col not in df.columns:
            continue

        # Get unique values and their counts in the column
        value_counts = df[raw_col].value_counts(dropna=False)

        errors_in_column, total_unknown = process_column_fuzzy_matching(
            value_counts, dropdown_opts, matching_map
        )

        if errors_in_column:
            # Sort errors_in_column: Invalid ones first, then valid ones
            errors_in_column.sort(key=lambda x: x["is_valid"])

            # Always include "Unknown" in dropdown options so it's selectable
            final_dropdown = sorted(set(dropdown_opts))
            if "Unknown" not in final_dropdown:
                final_dropdown.append("Unknown")

            columns_with_errors.append(
                {
                    "schema_column": standard_col,
                    "file_column": raw_col,
                    "header_title": f"{raw_col} ({standard_col})",
                    "unknown_count": total_unknown,
                    "dropdown_options": final_dropdown,
                    "value_mappings": errors_in_column,
                }
            )

    return {"columns": columns_with_errors}
