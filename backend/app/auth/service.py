#Login and Register logic it checks login passwords and creates token
from sqlalchemy.orm import Session
from sqlalchemy import text
from passlib.context import CryptContext
import bcrypt
from app.auth.jwt_handler import create_token


def hash_password(plain_password: str):
    password_bytes = plain_password.encode("utf-8")
    salt           = bcrypt.gensalt()
    hashed         = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str):
    password_bytes = plain_password.encode("utf-8")
    hashed_bytes   = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def register_user(db: Session, username: str, email: str, password: str, role: str):
    existing_email = db.execute(
        text("SELECT UserID FROM Users WHERE Email = :email"),
        {"email": email}
    ).first()
    if existing_email:
        return None, "Email already registered"

    existing_username = db.execute(
        text("SELECT UserID FROM Users WHERE Username = :username"),
        {"username": username}
    ).first()
    if existing_username:
        return None, "Username already taken"

    hashed = hash_password(password)
    db.execute(text("""
        INSERT INTO Users (Username, Email, PasswordHash, Role, IsActive, IsApproved)
        VALUES (:username, :email, :hashed, 'User', 1, 0)
    """), {"username": username, "email": email, "hashed": hashed})
    db.commit()
    return "Registration submitted. An admin must approve your account before you can log in.", None


def login_user(db: Session, email: str, password: str):
    user = db.execute(
        text("""
            SELECT UserID, Username, Email, PasswordHash, Role, IsActive, IsApproved
            FROM Users
            WHERE Email = :email AND IsActive = 1
        """),
        {"email": email}
    ).mappings().first()

    if not user:
        return None, "Invalid email or password"

    if not user["IsApproved"]:
        return None, "Your account is pending admin approval"

    if not user["PasswordHash"]:
        return None, "Password not set yet. Please set your password first."

    password_correct = verify_password(password, user["PasswordHash"])

    if not password_correct:
        return None, "Invalid email or password"

    token = create_token({
        "user_id": user["UserID"],
        "email":   user["Email"],
        "role":    user["Role"]
    })

    return {
        "access_token": token,
        "token_type":   "bearer",
        "role":         user["Role"],
        "username":     user["Username"]
    }, None


def admin_create_user(db: Session, username: str, email: str, password: str, role: str, employee_id: int = None):
    if role not in ("Admin", "User"):
        return None, "Role must be 'Admin' or 'User'"

    existing_email = db.execute(
        text("SELECT UserID FROM Users WHERE Email = :email"),
        {"email": email}
    ).first()
    if existing_email:
        return None, "Email already registered"

    existing_username = db.execute(
        text("SELECT UserID FROM Users WHERE Username = :username"),
        {"username": username}
    ).first()
    if existing_username:
        return None, "Username already taken"

    hashed = hash_password(password)
    db.execute(text("""
        INSERT INTO Users (Username, Email, PasswordHash, Role, IsActive, IsApproved, EmployeeID)
        VALUES (:username, :email, :hashed, :role, 1, 1, :emp)
    """), {"username": username, "email": email, "hashed": hashed, "role": role, "emp": employee_id})
    db.commit()
    return f"{role} account created successfully", None


def generate_login_for_employee(db: Session, employee_id: int):
    emp = db.execute(
        text("SELECT EmployeeID, EmployeeName, Email FROM Employees WHERE EmployeeID = :id"),
        {"id": employee_id}
    ).mappings().first()

    if not emp:
        return None, "Employee not found"

    existing = db.execute(
        text("SELECT UserID FROM Users WHERE EmployeeID = :id OR Email = :email"),
        {"id": employee_id, "email": emp["Email"]}
    ).first()
    if existing:
        return None, "Login already exists for this employee"

    username = emp["EmployeeName"].replace(" ", "").lower()

    taken = db.execute(
        text("SELECT UserID FROM Users WHERE Username = :u"),
        {"u": username}
    ).first()
    if taken:
        username = f"{username}{employee_id}"

    db.execute(text("""
        INSERT INTO Users (Username, Email, PasswordHash, Role, IsActive, IsApproved, EmployeeID)
        VALUES (:username, :email, NULL, 'User', 1, 1, :emp_id)
    """), {"username": username, "email": emp["Email"], "emp_id": employee_id})
    db.commit()

    return f"Login created for {emp['EmployeeName']}. They can now set their password.", None


def set_own_password(db: Session, email: str, new_password: str):
    user = db.execute(
        text("""
            SELECT UserID, PasswordHash FROM Users
            WHERE Email = :email AND IsActive = 1 AND IsApproved = 1
        """),
        {"email": email}
    ).mappings().first()

    if not user:
        return None, "No account found with this email"

    if user["PasswordHash"] is not None:
        return None, "Password already set. Use login instead."

    hashed = hash_password(new_password)
    db.execute(
        text("UPDATE Users SET PasswordHash = :h WHERE UserID = :id"),
        {"h": hashed, "id": user["UserID"]}
    )
    db.commit()
    return "Password set successfully. You can now log in.", None