from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.asset_group import AssetGroupCreate, AssetGroupUpdate
from app.services.asset_group_service import (
    get_all_groups,
    get_group_by_id,
    create_group,
    update_group,
    delete_group,
    get_assets_by_group
)
from app.auth.dependencies import get_current_user, require_admin

router = APIRouter(
    prefix = "/api/asset-groups",
    tags   = ["Asset Groups"]
)


@router.get("/")
def get_all_groups_route(
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(get_current_user)
):
    return get_all_groups(db)


@router.get("/{group_id}")
def get_group_route(
    group_id:     int,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(get_current_user)
):
    group = get_group_by_id(db, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.get("/{group_id}/assets")
def get_assets_in_group_route(
    group_id:     int,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(get_current_user)
):
    return get_assets_by_group(db, group_id)


@router.post("/", status_code=201)
def create_group_route(
    group:        AssetGroupCreate,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    error = create_group(db, group.model_dump())
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {"message": "Group created successfully"}


@router.put("/{group_id}")
def update_group_route(
    group_id:     int,
    group:        AssetGroupUpdate,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    update_group(db, group_id, group.model_dump())
    return {"message": "Group updated successfully"}


@router.delete("/{group_id}")
def delete_group_route(
    group_id:     int,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(require_admin)
):
    error = delete_group(db, group_id)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {"message": "Group deleted successfully"}