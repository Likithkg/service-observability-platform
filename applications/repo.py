from sqlalchemy.orm import Session
from uuid import UUID

from database.models import Application
from applications.schema import ApplicationsCreate, AwsCredentialsUpdate
from helper.encryption import encrypt_value


def create_application(
        db: Session,
        *,
        user_id: UUID,
        app_in: ApplicationsCreate
) -> Application:
    """
    Create new application by the user.
    """
    # Encrypt AWS credentials if provided
    aws_access_key = None
    aws_secret_key = None
    
    if app_in.aws_access_key_id:
        aws_access_key = encrypt_value(app_in.aws_access_key_id)
    if app_in.aws_secret_access_key:
        aws_secret_key = encrypt_value(app_in.aws_secret_access_key)
    
    application = Application(
        user_id=user_id,
        name=app_in.name,
        collector_type=app_in.collector_type,
        cloud=app_in.cloud,
        region=app_in.region,
        instance_id=app_in.instance_id,
        bucket_name=app_in.bucket_name,
        function_name=app_in.function_name,
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key,
        is_active=True
    )

    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def get_application_by_user(
        db: Session,
        *,
        user_id: UUID
) -> list[Application]:
    """
    Returns all the applications owned by the user.
    """
    return (
        db.query(Application)
        .filter(
            Application.user_id == user_id, 
            Application.is_active.is_(True)
        )
        .all()
    )


def get_application_by_id(
        db: Session,
        *,
        app_id: UUID,
        user_id: UUID
) -> Application | None:
    """
    Fetch a single application by id to enforce the ownership.
    """
    return (
        db.query(Application)
        .filter(
            Application.id == app_id,
            Application.user_id == user_id,
            Application.is_active.is_(True)
        )
        .first()
    )


def soft_delete_application(
        db: Session,
        *,
        app_id: UUID,
        user_id: UUID
) -> bool:
    """
    Permanently delete an application from the database.
    Returns True if deleted, False if not found.
    """
    application = (
        db.query(Application)
        .filter(
            Application.id == app_id,
            Application.user_id == user_id
        )
        .first()
    )

    if not application:
        return False

    db.delete(application)
    db.commit()
    return True


def update_aws_credentials(
        db: Session,
        *,
        app_id: UUID,
        user_id: UUID,
        creds_in: AwsCredentialsUpdate
) -> Application | None:
    """
    Update AWS credentials for an application.
    Credentials are encrypted before storing.
    """
    application = (
        db.query(Application)
        .filter(
            Application.id == app_id,
            Application.user_id == user_id,
            Application.is_active.is_(True)
        )
        .first()
    )

    if not application:
        return None
    
    application.aws_access_key_id = encrypt_value(creds_in.aws_access_key_id)
    application.aws_secret_access_key = encrypt_value(creds_in.aws_secret_access_key)
    
    db.commit()
    db.refresh(application)
    return application
