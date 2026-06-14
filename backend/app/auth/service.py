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


def register_user(
        db:         Session,
        username:   str,
        email:      str,
        password:   str,
        role:       str,
):
    
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
    
    #update 1 

    hashed  = hash_password(password)

    db.execute(text("""
                    INSERT INTO Users (Username, Email, PasswordHash, Role , IsActive , IsApproved )
                    VALUES(:username,:email,:hashed,'User',1,0)
                    """),{
                        "username":username,
                        "email":email,
                        "hashed":hashed
                    })
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


def admin_create_user(
        db:          Session,
        username:    str,
        email:       str,
        password:    str,
        role:        str,
        employee_id: int = None,
):
    # Called only by an authenticated Admin, so it may create Admins too.
    # Accounts made here are immediately active and approved.
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
    """), {
        "username": username,
        "email":    email,
        "hashed":   hashed,
        "role":     role,
        "emp":      employee_id
    })
    db.commit()

    return f"{role} account created successfully", None