import uuid

from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.base import Base

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'schema': 'observability'}

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    email = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )
    password = Column(
        String,
        nullable=False
    )
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

class Application(Base):
    __tablename__ = "applications"
    __table_args__ = {'schema': 'observability'}

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("observability.users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    collector_type = Column(
        String,
        nullable=False
    )

    cloud = Column(
        String,
        nullable=False
    )

    region = Column(
        String,
        nullable=False
    )

    instance_id = Column(
        String,
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    aws_access_key_id = Column(
        String,
        nullable=True
    )

    aws_secret_access_key = Column(
        String,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
