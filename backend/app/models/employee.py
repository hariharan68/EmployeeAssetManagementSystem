#Matching you Database Column Names what shape employee Data Must be 
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date 


class EmployeeCreate(BaseModel):
    EmployeeCode: Optional[str] = None
    EmployeeName:str
    Department:Optional[str]=None
    Designation:Optional[str]=None
    Email:Optional[EmailStr]=None
    Mobile:Optional[str]=None
    JoiningDate:Optional[date]=None

class EmployeeUpdate(BaseModel):
    EmployeeCode: Optional[str] = None
    EmployeeName: Optional[str] = None
    Department:Optional[str]=None
    Designation:Optional[str]=None
    Email:Optional[EmailStr]=None
    Mobile:Optional[str]=None
    JoiningDate:Optional[date]=None
    IsActive: Optional[bool]=None


class EmployeeResponse(BaseModel):
    EmployeeID:   int
    EmployeeCode: Optional[str]
    EmployeeName: Optional[str]
    Department:   Optional[str]
    Designation:  Optional[str]
    Email:        Optional[str]
    Mobile:       Optional[str]
    JoiningDate:  Optional[date]
    IsActive:     Optional[bool]

    class Config:
        from_attributes = True