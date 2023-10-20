from pydantic import BaseModel, EmailStr


class GraphInvitation(BaseModel):
    invite_redeem_url: str | None
    invite_redirect_url: str | None
    invited_user_display_name: str | None
    invited_user_email_address: str | None
    invited_user_type: str | None
    status: str | None


class GraphInvitationCreateRequest(BaseModel):
    invited_user_email_address: EmailStr
    invited_user_display_name: str | None = None
