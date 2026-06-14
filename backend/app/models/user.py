# what shape user data must be when coming in and going out.
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    username : str 
    email : EmailStr
    password:str
    role: Optional[str]="User" 

class UserLogin(BaseModel):
    email: EmailStr
    password:str

class AdminCreateUser(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "User"
    EmployeeID: Optional[int] = None

class TokenResponse(BaseModel):
    access_token:str
    token_type:str
    role:str
    username:str

class CurrentUser(BaseModel):
    UserID:int
    Username:str
    Email:str
    Role:str

    
