import pytest
import time

def test_create_duplicate_asset_code(self, client, admin_headers):
    unique_code   = f"DUP_{int(time.time())}"
    unique_serial = f"SER_{int(time.time())}"

    asset_data = {
        "AssetCode":    unique_code,
        "AssetName":    "First Asset",
        "AssetType":    "Mouse",
        "Brand":        "Brand",
        "Model":        "Model",
        "SerialNumber": unique_serial,
        "PurchaseDate": "2024-01-01"
    }

    first = client.post(
        "/api/assets/",
        headers=admin_headers,
        json=asset_data
    )
    assert first.status_code == 201

    asset_data["SerialNumber"] = f"SER2_{int(time.time())}"
    second = client.post(
        "/api/assets/",
        headers=admin_headers,
        json=asset_data
    )
    assert second.status_code == 400


class TestGetAssets:

    def test_get_all_assets(self, client, admin_headers):
        # Test Case 29 — Get all assets
        response = client.get("/api/assets/", headers=admin_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_get_assets_filter_available(self, client, admin_headers):
        # Test Case 30 — Filter assets by Available status
        response = client.get(
            "/api/assets/?status=Available",
            headers=admin_headers
        )
        assert response.status_code == 200
        assets = response.json()
        # Every returned asset must have Available status
        for asset in assets:
            assert asset["Status"] == "Available"

    def test_get_assets_filter_assigned(self, client, admin_headers):
        # Test Case 31 — Filter assets by Assigned status
        response = client.get(
            "/api/assets/?status=Assigned",
            headers=admin_headers
        )
        assert response.status_code == 200
        assets = response.json()
        for asset in assets:
            assert asset["Status"] == "Assigned"

    def test_get_asset_by_id(self, client, admin_headers):
        # Test Case 32 — Get specific asset
        all_assets = client.get(
            "/api/assets/",
            headers=admin_headers
        ).json()

        if len(all_assets) > 0:
            asset_id = all_assets[0]["AssetID"]
            response = client.get(
                f"/api/assets/{asset_id}",
                headers=admin_headers
            )
            assert response.status_code == 200
            assert response.json()["AssetID"] == asset_id

    def test_get_nonexistent_asset(self, client, admin_headers):
        # Test Case 33 — Non existent asset returns 404
        response = client.get(
            "/api/assets/99999",
            headers=admin_headers
        )
        assert response.status_code == 404

    def test_get_assets_without_token(self, client):
        # Test Case 34 — No token is rejected
        response = client.get("/api/assets/")
        assert response.status_code == 401


class TestCreateAsset:

    def test_create_asset_as_admin(self, client, admin_headers):
        # Test Case 35 — Admin can create asset
        response = client.post("/api/assets/", headers=admin_headers, json={
            "AssetCode":    "TST_AST_001",
            "AssetName":    "Test Laptop",
            "AssetType":    "Laptop",
            "Brand":        "TestBrand",
            "Model":        "TestModel X1",
            "SerialNumber": "TST123456",
            "PurchaseDate": "2024-01-01"
        })
        assert response.status_code == 201
        assert response.json()["message"] == "Asset created successfully"

    def test_create_asset_as_viewer(self, client, user_headers):
        # Test Case 36 — Viewer CANNOT create asset
        response = client.post("/api/assets/", headers=user_headers, json={
            "AssetCode":    "TST_AST_002",
            "AssetName":    "Viewer Laptop",
            "AssetType":    "Laptop",
            "Brand":        "Brand",
            "Model":        "Model",
            "SerialNumber": "VWR123456",
            "PurchaseDate": "2024-01-01"
        })
        assert response.status_code == 403

    def test_create_duplicate_asset_code(self, client, admin_headers):
        # Test Case 37 — Duplicate asset code is rejected
        asset_data = {
            "AssetCode":    "DUP_AST_001",
            "AssetName":    "First Asset",
            "AssetType":    "Mouse",
            "Brand":        "Brand",
            "Model":        "Model",
            "SerialNumber": "DUP111111",
            "PurchaseDate": "2024-01-01"
        }

        first = client.post(
            "/api/assets/",
            headers=admin_headers,
            json=asset_data
        )
        assert first.status_code == 201

        asset_data["SerialNumber"] = "DUP222222"
        second = client.post(
            "/api/assets/",
            headers=admin_headers,
            json=asset_data
        )
        assert second.status_code == 400

    def test_asset_default_status_is_available(self, client, admin_headers):
        # Test Case 38 — New asset status must be Available
        client.post("/api/assets/", headers=admin_headers, json={
            "AssetCode":    "STATUS_TEST_001",
            "AssetName":    "Status Test Asset",
            "AssetType":    "Keyboard",
            "Brand":        "Brand",
            "Model":        "Model",
            "SerialNumber": "STS123456",
            "PurchaseDate": "2024-01-01"
        })

        all_assets = client.get(
            "/api/assets/",
            headers=admin_headers
        ).json()

        new_asset = next(
            (a for a in all_assets if a["AssetCode"] == "STATUS_TEST_001"),
            None
        )
        assert new_asset is not None
        assert new_asset["Status"] == "Available"