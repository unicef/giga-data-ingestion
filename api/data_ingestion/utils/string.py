import re


def is_valid_format_code(format_string: str) -> bool:
    allowed_format_codes = ["%Y", "%m", "%d", "%H", "%M", "%S", "%z"]
    allowed_separators = ["/", "-", "_", ".", "+", ":", " "]

    special_formats = ["timestamp", "unix"]

    if format_string in special_formats:
        return True

    format_code_regex = (
        "(" + "|".join(re.escape(code) for code in allowed_format_codes) + ")"
    )
    separator_regex = (
        "[" + "".join(re.escape(separator) for separator in allowed_separators) + "]?"
    )

    regex_pattern = f"^{format_code_regex}({separator_regex}{format_code_regex})*$"

    if re.match(regex_pattern, format_string):
        return True
    else:
        return False
