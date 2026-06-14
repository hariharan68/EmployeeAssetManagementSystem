import pytest
import time

@pytest.fixture(autouse=True)
def setup_data(self, client, admin_headers):
    ts = int(time.time())

    emp_code  = f"AE_{ts}"
    emp_email = f"assign_{ts}@test.com"
    ast_code  = f"AA_{ts}"
    ast_serial = f"AS_{ts}"

    emp_resp = client.post(
        "/api/employees/",
        headers=admin_headers,
        json={
            "EmployeeCode": emp_code,
            "EmployeeName": "Assignment Tester",
            "Department":   "Testing",
            "Designation":  "Tester",
            "Email":        emp_email,
            "Mobile":       "1111111111",
            "JoiningDate":  "2024-01-01"
        }
    )

    ast_resp = client.post(
        "/api/assets/",
        headers=admin_headers,
        json={
            "AssetCode":    ast_code,
            "AssetName":    "Assignment Test Laptop",
            "AssetType":    "Laptop",
            "Brand":        "Brand",
            "Model":        "Model",
            "SerialNumber": ast_serial,
            "PurchaseDate": "2024-01-01"
        }
    )

    employees = client.get(
        "/api/employees/",
        headers=admin_headers
    ).json()

    assets = client.get(
        "/api/assets/?status=Available",
        headers=admin_headers
    ).json()

    self.employee_id = employees[-1]["EmployeeID"] if employees else None
    self.asset_id    = assets[-1]["AssetID"]       if assets    else None


class TestAssignments:

    @pytest.fixture(autouse=True)
    def setup_data(self, client, admin_headers):
        # Create fresh employee and asset for each test
        client.post("/api/employees/", headers=admin_headers, json={
            "EmployeeCode": "ASSIGN_EMP",
            "EmployeeName": "Assignment Tester",
            "Department":   "Testing",
            "Designation":  "Tester",
            "Email":        "assign.tester@test.com",
            "Mobile":       "1111111111",
            "JoiningDate":  "2024-01-01"
        })

        client.post("/api/assets/", headers=admin_headers, json={
            "AssetCode":    "ASSIGN_AST",
            "AssetName":    "Assignment Test Laptop",
            "AssetType":    "Laptop",
            "Brand":        "Brand",
            "Model":        "Model",
            "SerialNumber": "ASSIGN123",
            "PurchaseDate": "2024-01-01"
        })

        employees = client.get(
            "/api/employees/",
            headers=admin_headers
        ).json()
        assets = client.get(
            "/api/assets/?status=Available",
            headers=admin_headers
        ).json()

        self.employee_id = employees[-1]["EmployeeID"] if employees else None
        self.asset_id    = assets[-1]["AssetID"]       if assets    else None

    def test_get_all_assignments(self, client, admin_headers):
        # Test Case 39 — Get all assignments
        response = client.get(
            "/api/assignments/",
            headers=admin_headers
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_assign_asset_success(self, client, admin_headers):
        # Test Case 40 — Admin can assign available asset
        if not self.employee_id or not self.asset_id:
            pytest.skip("No employee or asset available")

        response = client.post(
            "/api/assignments/assign",
            headers=admin_headers,
            json={
                "EmployeeID":   self.employee_id,
                "AssetID":      self.asset_id,
                "AssignedDate": "2024-06-01",
                "Remarks":      "Test assignment"
            }
        )
        assert response.status_code == 201
        assert response.json()["message"] == "Asset assigned successfully"

    def test_asset_status_changes_to_assigned(
        self, client, admin_headers
    ):
        # Test Case 41 — Asset status becomes Assigned after assignment
        if not self.employee_id or not self.asset_id:
            pytest.skip("No employee or asset available")

        client.post(
            "/api/assignments/assign",
            headers=admin_headers,
            json={
                "EmployeeID":   self.employee_id,
                "AssetID":      self.asset_id,
                "AssignedDate": "2024-06-01",
                "Remarks":      "Status test"
            }
        )

        asset_response = client.get(
            f"/api/assets/{self.asset_id}",
            headers=admin_headers
        )
        assert asset_response.json()["Status"] == "Assigned"

    def test_cannot_assign_already_assigned_asset(
        self, client, admin_headers
    ):
        # Test Case 42 — Cannot assign asset that is already assigned
        if not self.employee_id or not self.asset_id:
            pytest.skip("No employee or asset available")

        # First assignment
        client.post(
            "/api/assignments/assign",
            headers=admin_headers,
            json={
                "EmployeeID":   self.employee_id,
                "AssetID":      self.asset_id,
                "AssignedDate": "2024-06-01",
                "Remarks":      "First assignment"
            }
        )

        # Second assignment of same asset should fail
        response = client.post(
            "/api/assignments/assign",
            headers=admin_headers,
            json={
                "EmployeeID":   self.employee_id,
                "AssetID":      self.asset_id,
                "AssignedDate": "2024-06-02",
                "Remarks":      "Second assignment"
            }
        )
        assert response.status_code == 400
        assert "not available" in response.json()["detail"]

    def test_assign_asset_as_viewer(self, client, user_headers):
        # Test Case 43 — Viewer CANNOT assign asset
        if not self.employee_id or not self.asset_id:
            pytest.skip("No employee or asset available")

        response = client.post(
            "/api/assignments/assign",
            headers=user_headers,
            json={
                "EmployeeID":   self.employee_id,
                "AssetID":      self.asset_id,
                "AssignedDate": "2024-06-01",
                "Remarks":      "Viewer trying to assign"
            }
        )
        assert response.status_code == 403

    def test_return_asset_success(self, client, admin_headers):
        # Test Case 44 — Admin can return assigned asset
        if not self.employee_id or not self.asset_id:
            pytest.skip("No employee or asset available")

        # First assign
        client.post(
            "/api/assignments/assign",
            headers=admin_headers,
            json={
                "EmployeeID":   self.employee_id,
                "AssetID":      self.asset_id,
                "AssignedDate": "2024-06-01",
                "Remarks":      "To be returned"
            }
        )

        # Get the assignment ID
        assignments = client.get(
            f"/api/assignments/employee/{self.employee_id}",
            headers=admin_headers
        ).json()

        if len(assignments) > 0:
            assignment_id = assignments[-1]["AssignmentID"]
            response      = client.put(
                f"/api/assignments/return/{assignment_id}",
                headers=admin_headers,
                json={
                    "ReturnedDate": "2024-06-10",
                    "Remarks":      "Returned in good condition"
                }
            )
            assert response.status_code == 200
            assert response.json()["message"] == "Asset returned successfully"

    def test_asset_status_returns_to_available(
        self, client, admin_headers
    ):
        # Test Case 45 — Asset status goes back to Available after return
        if not self.employee_id or not self.asset_id:
            pytest.skip("No employee or asset available")

        # Assign
        client.post(
            "/api/assignments/assign",
            headers=admin_headers,
            json={
                "EmployeeID":   self.employee_id,
                "AssetID":      self.asset_id,
                "AssignedDate": "2024-06-01",
                "Remarks":      "Will return"
            }
        )

        # Get assignment ID
        assignments = client.get(
            f"/api/assignments/employee/{self.employee_id}",
            headers=admin_headers
        ).json()

        if len(assignments) > 0:
            assignment_id = assignments[-1]["AssignmentID"]

            # Return it
            client.put(
                f"/api/assignments/return/{assignment_id}",
                headers=admin_headers,
                json={
                    "ReturnedDate": "2024-06-10",
                    "Remarks":      "Returned"
                }
            )

            # Check asset status is Available again
            asset = client.get(
                f"/api/assets/{self.asset_id}",
                headers=admin_headers
            ).json()
            assert asset["Status"] == "Available"

    def test_cannot_return_already_returned_asset(
        self, client, admin_headers
    ):
        # Test Case 46 — Cannot return an already returned asset
        if not self.employee_id or not self.asset_id:
            pytest.skip("No employee or asset available")

        # Assign
        client.post(
            "/api/assignments/assign",
            headers=admin_headers,
            json={
                "EmployeeID":   self.employee_id,
                "AssetID":      self.asset_id,
                "AssignedDate": "2024-06-01",
                "Remarks":      "Will double return"
            }
        )

        assignments = client.get(
            f"/api/assignments/employee/{self.employee_id}",
            headers=admin_headers
        ).json()

        if len(assignments) > 0:
            assignment_id = assignments[-1]["AssignmentID"]

            # First return
            client.put(
                f"/api/assignments/return/{assignment_id}",
                headers=admin_headers,
                json={
                    "ReturnedDate": "2024-06-10",
                    "Remarks":      "First return"
                }
            )

            # Second return should fail
            response = client.put(
                f"/api/assignments/return/{assignment_id}",
                headers=admin_headers,
                json={
                    "ReturnedDate": "2024-06-11",
                    "Remarks":      "Second return attempt"
                }
            )
            assert response.status_code == 400
            assert "already returned" in response.json()["detail"]

    def test_get_assignments_by_employee(
        self, client, admin_headers
    ):
        # Test Case 47 — Get assignment history for one employee
        if not self.employee_id:
            pytest.skip("No employee available")

        response = client.get(
            f"/api/assignments/employee/{self.employee_id}",
            headers=admin_headers
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_return_asset_as_viewer(self, client, user_headers):
        # Test Case 48 — Viewer CANNOT return asset
        response = client.put(
            "/api/assignments/return/1",
            headers=user_headers,
            json={
                "ReturnedDate": "2024-06-10",
                "Remarks":      "Viewer trying to return"
            }
        )
        assert response.status_code == 403