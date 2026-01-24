from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from auth.dependency import get_current_user
from database.database import get_db
from database.models import User
from applications.schema import ApplicationRes, ApplicationsCreate, AwsCredentialsUpdate
from applications.repo import (
    create_application,
    get_application_by_id,
    get_application_by_user,
    soft_delete_application,
    update_aws_credentials
)

router = APIRouter()

@router.post("", response_model=ApplicationRes, status_code=status.HTTP_201_CREATED)
def create_app(
    app_in: ApplicationsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    application = create_application(
        db,
        user_id=current_user.id,
        app_in=app_in
    )
    return application

@router.get("", response_model=List[ApplicationRes])
def list_app(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_application_by_user(
        db,
        user_id = current_user.id
    )

@router.get("/{app_id}", response_model=ApplicationRes)
def get_app(
    app_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    application = get_application_by_id(
        db, 
        app_id = app_id,
        user_id=current_user.id
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application Not Found"
        )
    return application

@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_app(
    app_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deleted = soft_delete_application(
        db,
        app_id=app_id,
        user_id=current_user.id

    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            details="Application not found"
        )
    return None


@router.put("/{app_id}/aws-credentials", response_model=ApplicationRes)
def update_app_credentials(
    app_id: UUID,
    creds_in: AwsCredentialsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update AWS credentials for an application"""
    application = update_aws_credentials(
        db,
        app_id=app_id,
        user_id=current_user.id,
        creds_in=creds_in
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    return application
