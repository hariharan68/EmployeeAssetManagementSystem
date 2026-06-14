from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.asset import AssetCreate, AssetUpdate
from app.services import asset_service
from app.auth.dependencies import get_current_user, require_admin

router = APIRouter(
    prefix = "/api/assets",
    tags   = ["Assets"]
)


@router.get("/")
def get_all_assets(
    status:       Optional[str] = None,
    db:           Session       = Depends(get_db),
    current_user: dict          = Depends(get_current_user)
):
    assets = asset_service.get_all_assets(db, status)
    return assets


@router.get("/{asset_id}")
def get_asset(
    asset_id:     int,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(get_current_user)
):
    asset = asset_service.get_asset_by_id(db, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.post("/", status_code=201)
def create_asset(
    asset:        AssetCreate,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    asset_service.create_asset(db, asset.model_dump())
    return {"message": "Asset created successfully"}


@router.put("/{asset_id}")
def update_asset(
    asset_id:     int,
    asset:        AssetUpdate,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    asset_service.update_asset(db, asset_id, asset.model_dump())
    return {"message": "Asset updated successfully"}


@router.delete("/{asset_id}")
def delete_asset(
    asset_id:     int,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    asset_service.delete_asset(db, asset_id)
    return {"message": "Asset deleted successfully"}