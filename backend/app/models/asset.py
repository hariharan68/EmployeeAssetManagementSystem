from pydantic import BaseModel,EmailStr
from typing  import Optional 
from datetime import date 

class AssetCreate(BaseModel):
    AssetCode: Optional[str]=None
    AssetName: Optional[str]=None
    AssetType: Optional[str]=None
    Brand: Optional[str]=None
    Model: Optional[str]=None
    SerialNumber: Optional[str] = None
    PurchaseDate: Optional[date] = None
    GroupID: Optional[int] = None
    
class AssetUpdate(BaseModel):
    AssetID: int
    AssetCode: Optional[str]=None
    AssetName: Optional[str]=None
    AssetType: Optional[str]=None
    Brand: Optional[str]=None
    Model: Optional[str]=None
    SerialNumber: Optional[str] = None
    PurchaseDate: Optional[date] = None
    Status: Optional[str]=None

    class AssetRespons(BaseModel):
        AssetID: int 
        AssetCode:    Optional[str]
    AssetName:    Optional[str]
    AssetType:    Optional[str]
    Brand:        Optional[str]
    Model:        Optional[str]
    SerialNumber: Optional[str]
    PurchaseDate: Optional[date]
    Status:       Optional[str]

class Config :
    from_attributes=True


