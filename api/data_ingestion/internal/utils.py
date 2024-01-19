def megabytes_to_bytes(mb: int | float) -> int | float:
    return mb * 2**20


def chunks(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i : i + n]  # noqa: E203
