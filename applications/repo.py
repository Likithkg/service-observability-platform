from sqlalchemy.orm import Session
from uuid import UUID

from database.models import Application
from applications.schema import ApplicationsCreate

def create_application(
        db: Session,
        *,
        user_id: UUID,
        app_in: Application
)-> Application:
    """
    Create new apoplication by the user.
    """
    application = Application(
        user_id = user_id,
        name = app_in.name,
        endpoint = str(app_in.endpoint),
        collector_type = app_in.collector_type,
        cloud = app_in.cloud,
        region = app_in.region,
        instance_id = app_in.instance_id,
        bucket = app_in.bucket,
        is_active = True
    )

    db.add(application)
    db.commit()
    db.refresh(application)
    return application

def get_application_by_user(
        db: Session,
        *,
        user_id:UUID
)-> list[Application]:
    """
    Returns all the application owned by the user.
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
)-> Application | None:
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
)->bool:
    """
    Soft delete an application by marking it inactive.
    Returns True if deleted, False if not found.
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
        return False
    application.is_active = False
    db.commit()
    return True