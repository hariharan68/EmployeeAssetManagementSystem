from pydantic import BaseModel, EmailStr
from typing import Optional 
from datetime import date 

class AssignAssetRequest(BaseModel):
    EmployeeID: int 
    AssetID: int
    AssignedDate: date 
    Remarks: Optional[str]=None

class ReturnAssetRequest(BaseModel):
    ReturnedDate: date
    Remarks: Optional[str]=None

class AssignmentRespons(BaseModel):
    AssignmentID:int
    EmployeeID: Optional[int]
    AssetID: Optional[int]
    AssignedDate: Optional[date]
    ReturnedDate: Optional[date]
    IsReturned: Optional[bool]
    Remarks: Optional[str]

class config:
    from_attributes=True