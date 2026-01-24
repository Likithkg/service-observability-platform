from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime


class ApplicationsCreate(BaseModel):
    name: str = Field(..., description="Application name")
    collector_type: str = Field(..., description="Type of collector (e.g., 'cloud', 'http')")
    cloud: str = Field(..., description="Cloud provider name")
    region: str = Field(..., description="Cloud region")
    instance_id: str = Field(..., description="Instance identifier")


class ApplicationRes(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    collector_type: str
    cloud: str
    region: str
    instance_id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
