from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.auth.jwt_handler import decode_token
from app.database import get_db

# HTTPBearer shows a simple token input in Swagger
# Instead of the confusing username/password OAuth2 form
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"}
    )

    # Extract the token from the credentials
    token = credentials.credentials

    payload = decode_token(token)
    if payload is None:
        raise credentials_error

    user_id = payload.get("user_id")

    user = db.execute(
        text("""
            SELECT UserID, Username, Email, Role, IsActive, EmployeeID
            FROM Users
            WHERE UserID = :id AND IsActive = 1
        """),
        {"id": user_id}
    ).mappings().first()

    if not user:
        raise credentials_error

    return dict(user)


def require_admin(
    current_user: dict = Depends(get_current_user)
):
    if current_user["Role"] != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user