from fastapi_azure_auth.user import User

from data_ingestion.internal.users import UsersApi


async def get_user_email(user: User) -> str:
    email = user.email or user.claims.get("email")
    if email is None:
        email = (await UsersApi.get_user(user.sub)).mail
    return email
