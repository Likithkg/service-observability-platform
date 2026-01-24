from pydantic import BaseModel, HttpUrl, Field
from typing import Optional
from uuid import UUID


class ApplicationsCreate(BaseModel):
    """
    schema to create new application to monitor.
    """
    name: str = Field(..., min_length=3, max_length=100)
    endpoint: HttpUrl
    collector_type: str = Field(default='http')
    cloud: str = Field(..., min_length=2, max_length=10)
    region: str = Field(..., min_length=2, max_length=10)
    instance_id: Optional[str] = None
    bucket: Optional[str] = None

class ApplicationRes(BaseModel):
    """
    Schema for returing application information.
    """
    id: UUID
    name: str
    endpoint: HttpUrl
    collector_type: str
    cloud: str
    region: str
    instance_id: Optional[str]
    bucket: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True