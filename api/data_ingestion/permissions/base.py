from abc import ABC, abstractmethod
from typing import Self

from fastapi import HTTPException, status


class BasePermission(ABC):
    raise_exceptions: bool

    def __init__(self, raise_exceptions: bool = True):
        self.raise_exceptions = raise_exceptions

    @classmethod
    def raises(cls, raise_exceptions: bool):
        return cls(raise_exceptions)

    @abstractmethod
    async def __call__(self, *args, **kwargs):
        pass

    def __or__(self, other: Self):
        if not (self or other):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    def __and__(self, other: Self):
        if not (self and other):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
