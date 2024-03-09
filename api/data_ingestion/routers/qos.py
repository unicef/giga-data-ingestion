import os
import random
from typing import Annotated

import magic
from azure.core.exceptions import HttpResponseError
from faker import Faker
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Response,
    Security,
    UploadFile,
    status,
)
from pydantic import Field
from sqlalchemy import delete, desc, exc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from data_ingestion.constants import constants
from data_ingestion.db import get_db
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.storage import storage_client
from data_ingestion.models import SchoolConnectivity, SchoolList
from data_ingestion.schemas.core import PagedResponseSchema
from data_ingestion.schemas.qos import CreateApiIngestionRequest, SchoolListSchema

router = APIRouter(
    prefix="/api/qos",
    tags=["qos"],
    dependencies=[Security(azure_scheme)],
)

fake = Faker()


@router.post("/create_dummy_ingestion")
async def create_dummy_ingestion(
    response: Response,
    number: int,
    db: AsyncSession = Depends(get_db),
):
    for _ in range(number):
        school_list = SchoolList(
            api_auth_api_key=f"api_key_{number}",
            api_auth_api_value=f"api_value_{number}",
            api_endpoint=fake.url(),
            authorization_type=random.choice(["BEARER_TOKEN", "BASIC_AUTH", "API_KEY"]),
            basic_auth_password="authpassword",
            basic_auth_username="authyuser",
            bearer_auth_bearer_token="bearertoken",
            data_key="datakey",
            enabled=fake.boolean(chance_of_getting_true=70),
            page_number_key="asdasd",
            page_offset_key="asdfasdf",
            page_size_key="1qdweqew",
            page_starts_with=123,
            pagination_type=random.choice(["PAGE_NUMBER", "LIMIT_OFFSET"]),
            query_parameters="sometihing",
            request_body=fake.json(
                data_columns={
                    "Spec": "@1.0.1",
                    "ID": "pyint",
                    "Details": {"Name": "name", "Address": "address"},
                },
                num_rows=2,
            ),
            request_method=random.choice(["GET", "POST"]),
            school_id_key="adsasdasd",
            send_query_in=random.choice(["QUERY_PARAMETERS", "BODY"]),
            size=23,
            user_email=fake.ascii_safe_email(),
            user_id="useriddd",
            name=fake.name(),
            column_to_schema_mapping=fake.json(
                data_columns={
                    "Spec": "@1.0.1",
                    "ID": "pyint",
                    "Details": {"Name": "name", "Address": "address"},
                },
                num_rows=2,
            ),
        )
        db.add(school_list)
        await db.commit()

        school_connectivity = SchoolConnectivity(
            api_auth_api_key=f"api_key_{number}",
            api_auth_api_value=f"api_value_{number}",
            api_endpoint=fake.url(),
            authorization_type=random.choice(["BEARER_TOKEN", "BASIC_AUTH", "API_KEY"]),
            basic_auth_password="authpassword",
            basic_auth_username="authyuser",
            bearer_auth_bearer_token="bearertoken",
            data_key="datakey",
            enabled=fake.boolean(chance_of_getting_true=70),
            page_number_key="asdasd",
            page_offset_key="asdfasdf",
            page_size_key="1qdweqew",
            page_starts_with=random.choice([0, 1]),
            pagination_type=random.choice(["PAGE_NUMBER", "LIMIT_OFFSET"]),
            query_parameters="sometihing",
            request_body=fake.json(
                data_columns={
                    "Spec": "@1.0.1",
                    "ID": "pyint",
                    "Details": {"Name": "name", "Address": "address"},
                },
                num_rows=2,
            ),
            request_method=random.choice(["GET", "POST"]),
            school_id_key="adsasdasd",
            send_query_in=random.choice(["QUERY_PARAMETERS", "BODY"]),
            size=23,
            user_email=fake.ascii_safe_email(),
            user_id="useriddd",
            ingestion_frequency=50,
            schema_url=fake.url(),
            school_list_id=school_list.id,
        )

        db.add(school_connectivity)
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
        data=items, page=page, page_size=count, total_count=total
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


@router.get("/school_connectivity/{school_list_id}")
async def get_school_connectivity(
    response: Response,
    school_list_id: str,
    db: AsyncSession = Depends(get_db),
):
    base_query = (
        select(SchoolConnectivity)
        .order_by(desc(SchoolConnectivity.date_created))
        .where(func.starts_with(SchoolConnectivity.school_list_id, school_list_id))
    )

    school_connectivity = await db.scalar(base_query)

    return school_connectivity


@router.post("/api_ingestion")
async def create_api_ingestion(
    response: Response,
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    data: CreateApiIngestionRequest = Depends(),
):
    if file.size > constants.UPLOAD_FILE_SIZE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10 MB limit",
        )

    valid_types = {
        "application/csv": [".csv"],
        "text/csv": [".csv"],
    }

    file_content = await file.read(2048)
    file_type = magic.from_buffer(file_content, mime=True)
    file_extension = os.path.splitext(file.filename)[1]

    if file_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type.",
        )

    if file_extension not in valid_types[file_type]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File extension does not match file type.",
        )

    school_connectivity_data = data.get_school_connectivity_model()
    school_list_data = data.get_school_list_model()

    print(school_connectivity_data)
    print(school_list_data)

    school_list = SchoolList(**school_list_data.model_dump())
    db.add(school_list)
    await db.commit()

    timestamp = school_list.date_created.strftime("%Y%m%d-%H%M%S")
    ext = os.path.splitext(file.filename)[1]
    filename_elements = [school_list.id]
    filename_elements.append(timestamp)
    filename = "_".join(filename_elements)
    upload_path = f"{constants.API_INGESTION_UPLOAD_PATH_PREFIX}/{filename}{ext}"

    client = storage_client.get_blob_client(upload_path)

    try:
        client.upload_blob(await file.read())
        response.status_code = status.HTTP_201_CREATED
    except HttpResponseError as err:
        await db.execute(delete(SchoolList).where(SchoolList.id == SchoolList.id))
        await db.commit()
        raise HTTPException(
            detail=err.message, status_code=err.response.status_code
        ) from err
    except Exception as err:
        await db.execute(delete(SchoolList).where(SchoolList.id == SchoolList.id))
        await db.commit()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR) from err

    school_connectivity = SchoolConnectivity(
        **school_connectivity_data.model_dump(),
        schema_url=upload_path,
        school_list_id=school_list.id,
    )

    db.add(school_connectivity)
    await db.commit()

    response.status_code = status.HTTP_201_CREATED