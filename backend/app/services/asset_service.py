from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError


def get_all_assets(db: Session, status: str = None):
    if status:
        result = db.execute(
            text("SELECT * FROM Assets WHERE Status = :status"),
            {"status": status}
        )
    else:
        result = db.execute(text("SELECT * FROM Assets"))
    return result.mappings().all()


def get_asset_by_id(db: Session, asset_id: int):
    result = db.execute(
        text("SELECT * FROM Assets WHERE AssetID = :id"),
        {"id": asset_id}
    ).mappings().first()
    return result


def create_asset(db: Session, data: dict):
    try:
        db.execute(text("""
            INSERT INTO Assets
                (AssetCode, AssetName, AssetType,
                 Brand, Model, SerialNumber,
                 PurchaseDate, Status, GroupID)
            VALUES
                (:code, :name, :type,
                 :brand, :model, :serial,
                 :purchase, :status, :group_id)
        """), {
            "code":     data.get("AssetCode"),
            "name":     data.get("AssetName"),
            "type":     data.get("AssetType"),
            "brand":    data.get("Brand"),
            "model":    data.get("Model"),
            "serial":   data.get("SerialNumber"),
            "purchase": data.get("PurchaseDate"),
            "status":   "Available",
            "group_id": data.get("GroupID")
        })
        db.commit()
        return None
    except IntegrityError:
        db.rollback()
        return "AssetCode or SerialNumber already exists"


def update_asset(db: Session, asset_id: int, data: dict):
    db.execute(text("""
        UPDATE Assets SET
            AssetCode    = COALESCE(:code,     AssetCode),
            AssetName    = COALESCE(:name,     AssetName),
            AssetType    = COALESCE(:type,     AssetType),
            Brand        = COALESCE(:brand,    Brand),
            Model        = COALESCE(:model,    Model),
            SerialNumber = COALESCE(:serial,   SerialNumber),
            PurchaseDate = COALESCE(:purchase, PurchaseDate),
            Status       = COALESCE(:status,   Status)
        WHERE AssetID = :id
    """), {
        "code":     data.get("AssetCode"),
        "name":     data.get("AssetName"),
        "type":     data.get("AssetType"),
        "brand":    data.get("Brand"),
        "model":    data.get("Model"),
        "serial":   data.get("SerialNumber"),
        "purchase": data.get("PurchaseDate"),
        "status":   data.get("Status"),
        "id":       asset_id
    })
    db.commit()


def delete_asset(db: Session, asset_id: int):
    db.execute(
        text("DELETE FROM Assets WHERE AssetID = :id"),
        {"id": asset_id}
    )
    db.commit()