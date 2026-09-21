from pydantic import BaseModel, EmailStr, Field
from app.schemas.user import UserResponse


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full or display name")
    email: EmailStr = Field(..., description="Unique email address")
    password: str = Field(..., min_length=6, max_length=100, description="Account password")


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="Account password")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
