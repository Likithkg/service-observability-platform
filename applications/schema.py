from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional


class ApplicationsCreate(BaseModel):
    name: str = Field(..., description="Application name")
    collector_type: str = Field(..., description="Type of collector (e.g., 'cloud', 'http')")
    cloud: str = Field(..., description="Cloud provider name")
    region: str = Field(..., description="Cloud region")
    bucket_name: Optional[str] = Field(None, description="Bucket name for S3 applications")
    instance_id: str = Field(None, description="Instance identifier")
    aws_access_key_id: Optional[str] = Field(None, description="AWS Access Key ID")
    aws_secret_access_key: Optional[str] = Field(None, description="AWS Secret Access Key")


class ApplicationRes(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    collector_type: str
    cloud: str
    region: str
    instance_id: Optional[str] = None
    bucket_name: Optional[str] = None
    is_active: bool
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AwsCredentialsUpdate(BaseModel):
    aws_access_key_id: str = Field(..., description="AWS Access Key ID")
    aws_secret_access_key: str = Field(..., description="AWS Secret Access Key")
