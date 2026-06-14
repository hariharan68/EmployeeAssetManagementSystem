from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AssetGroupCreate(BaseModel):
    GroupCode: str
    GroupName: str


class AssetGroupUpdate(BaseModel):
    GroupCode: Optional[str] = None
    GroupName: Optional[str] = None


class AssetGroupResponse(BaseModel):
    GroupID:   int
    GroupCode: str
    GroupName: str
    CreatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True