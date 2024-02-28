import math
import random
from typing import Annotated

from faker import Faker
from fastapi import APIRouter, Depends, HTTPException, Query, Response, Security, status
from pydantic import Field
from sqlalchemy import desc, exc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from data_ingestion.db import get_db
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.models import SchoolList
from data_ingestion.schemas.common import PagedResponseSchema
from data_ingestion.schemas.qos import SchoolListSchema

router = APIRouter(
    prefix="/api/qos",
    tags=["qos"],
    dependencies=[Security(azure_scheme)],
)


fake = Faker()


@router.post("/mock_school_lists")
async def create_mock_school_lists(
    response: Response,
    number: int,
    db: AsyncSession = Depends(get_db),
):
    for _ in range(number):
        file_upload = SchoolList(
            request_method=random.choice(["GET", "POST"]),
            api_endpoint=fake.url(),
            data_key="test",
            school_id_key="adsasdasd",
            query_parameters="sometihing",
            request_body=fake.json(
                data_columns={
                    "Spec": "@1.0.1",
                    "ID": "pyint",
                    "Details": {"Name": "name", "Address": "address"},
                },
                num_rows=2,
            ),
            authorization_type=random.choice(["BEARER_TOKEN", "BASIC_AUTH", "API_KEY"]),
            bearer_auth_bearer_token="asdasdasd",
            basic_auth_username="authyuser",
            basic_auth_password="authpassword",
            api_auth_api_key="asdasd",
            api_auth_api_value="asas",
            pagination_type=random.choice(["PAGE_NUMBER", "LIMIT_OFFSET"]),
            size=23,
            page_size_key="1qdweqew",
            send_query_in=random.choice(["QUERY_PARAMETERS", "BODY"]),
            page_number_key="asdasd",
            page_starts_with=123,
            page_offset_key="asdfasdf",
            enabled=fake.boolean(chance_of_getting_true=70),
            user_id="useriddd",
            user_email=fake.ascii_safe_email(),
            name=fake.name(),
        )
        db.add(file_upload)

    await db.commit()
    response.status_code = status.HTTP_201_CREATED


@router.get("/school_list", response_model=PagedResponseSchema)
async def list_school_lists(
    response: Response,
    db: AsyncSession = Depends(get_db),
    count: Annotated[int, Field(ge=1, le=50)] = 10,
    page: Annotated[int, Query(ge=1)] = 1,
    id_search: Annotated[
        str,
        Query(min_length=1, max_length=24, pattern=r"^\w+$"),
    ] = None,
):
    base_query = select(SchoolList).order_by(desc(SchoolList.date_created))

    if id_search:
        base_query = base_query.where(func.starts_with(SchoolList.id, id_search))

    count_query = select(func.count()).select_from(base_query.subquery())
    total = await db.scalar(count_query)

    items = await db.scalars(base_query.offset((page - 1) * count).limit(count))

    paged_response = PagedResponseSchema[SchoolListSchema](
        data=items,
        page_index=page,
        per_page=count,
        total_items=total,
        total_pages=math.ceil(total / count),
    )

    if not len(paged_response.data):
        response.status_code = status.HTTP_204_NO_CONTENT

    return paged_response


@router.get("/school_list/{id}", response_model=SchoolListSchema)
async def get_school_list(
    response: Response,
    id: str,
    db: AsyncSession = Depends(get_db),
):
    base_query = (
        select(SchoolList)
        .order_by(desc(SchoolList.date_created))
        .where(func.starts_with(SchoolList.id, id))
    )

    school_list = await db.scalar(base_query)

    return school_list


@router.patch("/school_list/{id}/status/{enabled}", status_code=status.HTTP_201_CREATED)
async def update_school_list_status(
    response: Response,
    id: str,
    enabled: bool,
    db: AsyncSession = Depends(get_db),
):
    try:
        update_query = (
            update(SchoolList).where(SchoolList.id == id).values(enabled=enabled)
        )
        await db.execute(update_query)
        await db.commit()
        response.status_code = status.HTTP_204_NO_CONTENT

    except exc.SQLAlchemyError as err:
        raise HTTPException(
            detail=err._message, status_code=status.HTTP_400_BAD_REQUEST
        ) from err

    return 0
