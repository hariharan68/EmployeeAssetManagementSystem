from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from app.database import get_db
from app.models.user import UserCreate, UserLogin, TokenResponse, AdminCreateUser
from app.auth import service
from app.auth.dependencies import get_current_user, require_admin

router = APIRouter(
    prefix = "/api/auth",
    tags   = ["Authentication"]
)


class ApproveRequest(BaseModel):
    EmployeeID: int


@router.post("/register", status_code=201)
def register(user: UserCreate, db: Session = Depends(get_db)):
    message, error = service.register_user(
        db,
        user.username,
        user.email,
        user.password,
        user.role
    )
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {"message": message}


@router.post("/login", response_model=TokenResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    result, error = service.login_user(
        db,
        user.email,
        user.password
    )
    if error:
        raise HTTPException(status_code=401, detail=error)
    return result


@router.get("/me")
def get_my_profile(
    current_user: dict = Depends(get_current_user)
):
    return {
        "UserID":   current_user["UserID"],
        "Username": current_user["Username"],
        "Email":    current_user["Email"],
        "Role":     current_user["Role"]
    }


# ── Admin: create a user or admin directly ─────────────────────────────────

@router.post("/admin/create-user", status_code=201)
def admin_create_user_route(
    payload:      AdminCreateUser,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    message, error = service.admin_create_user(
        db,
        payload.username,
        payload.email,
        payload.password,
        payload.role,
        payload.EmployeeID
    )
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {"message": message}


# ── Admin: approve / reject pending registrations ──────────────────────────

@router.get("/pending")
def list_pending_users(
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    rows = db.execute(text("""
        SELECT UserID, Username, Email, CreatedDate
        FROM Users
        WHERE IsApproved = 0 AND IsActive = 1
        ORDER BY CreatedDate DESC
    """)).mappings().all()
    return rows


@router.put("/approve/{user_id}")
def approve_user(
    user_id:      int,
    body:         ApproveRequest,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    db.execute(text("""
        UPDATE Users
        SET IsApproved = 1, EmployeeID = :emp
        WHERE UserID = :id
    """), {"emp": body.EmployeeID, "id": user_id})
    db.commit()
    return {"message": "User approved and linked to employee"}


@router.delete("/reject/{user_id}")
def reject_user(
    user_id:      int,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    db.execute(
        text("UPDATE Users SET IsActive = 0 WHERE UserID = :id"),
        {"id": user_id}
    )
    db.commit()
    return {"message": "User rejected"}

# ── Admin: generate login for an existing employee ─────────────────────────
@router.post("/generate-login/{employee_id}", status_code=201)
def generate_login(
    employee_id:  int,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    message, error = service.generate_login_for_employee(db, employee_id)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {"message": message}


# ── Public: employee sets their own password (first time) ──────────────────
class SetPasswordRequest(BaseModel):
    email:    str
    password: str

@router.post("/set-password")
def set_password(body: SetPasswordRequest, db: Session = Depends(get_db)):
    message, error = service.set_own_password(db, body.email, body.password)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {"message": message}

@router.get("/employees-with-logins")
def get_employees_with_logins(
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    rows = db.execute(text("""
        SELECT EmployeeID FROM Users
        WHERE EmployeeID IS NOT NULL AND IsActive = 1
    """)).fetchall()
    return [r[0] for r in rows]


# Checking the email with the rool id is active in db 
class CheckEmailRequest(BaseModel):
    email: str

@router.post("/check-email")
def check_email(body: CheckEmailRequest, db: Session = Depends(get_db)):
    user = db.execute(text("""
        SELECT Role, PasswordHash FROM Users
        WHERE Email = :email AND IsActive = 1 AND IsApproved = 1
    """), {"email": body.email}).mappings().first()

    if not user:
        return {"exists": False}

    return {
        "exists": True,
        "role": user["Role"],
        "has_password": user["PasswordHash"] is not None
    }