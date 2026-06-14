import pytest
import time

def test_create_duplicate_employee_code(self, client, admin_headers):
    unique_code = f"DUP_{int(time.time())}"
    employee_data = {
        "EmployeeCode": unique_code,
        "EmployeeName": "First Employee",
        "Department":   "IT",
        "Designation":  "Developer",
        "Email":        f"first_{int(time.time())}@company.com",
        "Mobile":       "6666666666",
        "JoiningDate":  "2024-06-01"
    }

    first = client.post(
        "/api/employees/",
        headers=admin_headers,
        json=employee_data
    )
    assert first.status_code == 201

    employee_data["Email"] = f"second_{int(time.time())}@company.com"
    second = client.post(
        "/api/employees/",
        headers=admin_headers,
        json=employee_data
    )
    assert second.status_code == 400


class TestGetEmployees:

    def test_get_all_employees_as_admin(self, client, admin_headers):
        # Test Case 15 — Admin can get all employees
        response = client.get("/api/employees/", headers=admin_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_get_all_employees_as_viewer(self, client, user_headers):
        # Test Case 16 — Viewer can also get all employees
        response = client.get("/api/employees/", headers=user_headers)
        assert response.status_code == 200

    def test_get_all_employees_without_token(self, client):
        # Test Case 17 — No token is rejected
        response = client.get("/api/employees/")
        assert response.status_code == 401

    def test_get_employee_by_id(self, client, admin_headers):
        # Test Case 18 — Get specific employee by ID
        # First create one
        client.post("/api/employees/", headers=admin_headers, json={
            "EmployeeCode": "TEST001",
            "EmployeeName": "Test Employee",
            "Department":   "Testing",
            "Designation":  "Tester",
            "Email":        "tester@test.com",
            "Mobile":       "1234567890",
            "JoiningDate":  "2024-01-01"
        })

        # Get all and pick first one
        all_employees = client.get(
            "/api/employees/",
            headers=admin_headers
        ).json()

        if len(all_employees) > 0:
            emp_id   = all_employees[0]["EmployeeID"]
            response = client.get(
                f"/api/employees/{emp_id}",
                headers=admin_headers
            )
            assert response.status_code == 200
            assert response.json()["EmployeeID"] == emp_id

    def test_get_nonexistent_employee(self, client, admin_headers):
        # Test Case 19 — Non existent employee returns 404
        response = client.get(
            "/api/employees/99999",
            headers=admin_headers
        )
        assert response.status_code == 404


class TestCreateEmployee:

    def test_create_employee_as_admin(self, client, admin_headers):
        # Test Case 20 — Admin can create employee
        response = client.post("/api/employees/", headers=admin_headers, json={
            "EmployeeCode": "EMP_TEST_01",
            "EmployeeName": "John Test",
            "Department":   "IT",
            "Designation":  "Developer",
            "Email":        "john.test@company.com",
            "Mobile":       "9999999999",
            "JoiningDate":  "2024-06-01"
        })
        assert response.status_code == 201
        assert response.json()["message"] == "Employee created successfully"

    def test_create_employee_as_viewer(self, client, user_headers):
        # Test Case 21 — Viewer CANNOT create employee
        # This must return 403 Forbidden
        response = client.post("/api/employees/", headers=user_headers, json={
            "EmployeeCode": "EMP_TEST_02",
            "EmployeeName": "Jane Test",
            "Department":   "HR",
            "Designation":  "Manager",
            "Email":        "jane.test@company.com",
            "Mobile":       "8888888888",
            "JoiningDate":  "2024-06-01"
        })
        assert response.status_code == 403

    def test_create_employee_without_token(self, client):
        # Test Case 22 — No token cannot create employee
        response = client.post("/api/employees/", json={
            "EmployeeCode": "EMP_TEST_03",
            "EmployeeName": "No Auth",
            "Department":   "IT",
            "Designation":  "Developer",
            "Email":        "noauth@company.com",
            "Mobile":       "7777777777",
            "JoiningDate":  "2024-06-01"
        })
        assert response.status_code == 403

    def test_create_duplicate_employee_code(self, client, admin_headers):
        # Test Case 23 — Duplicate employee code is rejected
        employee_data = {
            "EmployeeCode": "DUPCODE001",
            "EmployeeName": "First Employee",
            "Department":   "IT",
            "Designation":  "Developer",
            "Email":        "first.emp@company.com",
            "Mobile":       "6666666666",
            "JoiningDate":  "2024-06-01"
        }

        # First creation should succeed
        first = client.post(
            "/api/employees/",
            headers=admin_headers,
            json=employee_data
        )
        assert first.status_code == 201

        # Second creation with same code should fail
        employee_data["Email"] = "second.emp@company.com"
        second = client.post(
            "/api/employees/",
            headers=admin_headers,
            json=employee_data
        )
        assert second.status_code == 400


class TestUpdateEmployee:

    def test_update_employee_as_admin(self, client, admin_headers):
        # Test Case 24 — Admin can update employee
        all_employees = client.get(
            "/api/employees/",
            headers=admin_headers
        ).json()

        if len(all_employees) > 0:
            emp_id   = all_employees[0]["EmployeeID"]
            response = client.put(
                f"/api/employees/{emp_id}",
                headers=admin_headers,
                json={"Department": "Updated Department"}
            )
            assert response.status_code == 200

    def test_update_employee_as_viewer(self, client, user_headers):
        # Test Case 25 — Viewer CANNOT update employee
        response = client.put(
            "/api/employees/1",
            headers=user_headers,
            json={"Department": "Hacked Department"}
        )
        assert response.status_code == 403


class TestDeleteEmployee:

    def test_deactivate_employee_as_admin(self, client, admin_headers):
        # Test Case 26 — Admin can deactivate employee
        # Create one first
        client.post("/api/employees/", headers=admin_headers, json={
            "EmployeeCode": "DELETE_TEST",
            "EmployeeName": "Delete Me",
            "Department":   "Test",
            "Designation":  "Tester",
            "Email":        "deleteme@test.com",
            "Mobile":       "5555555555",
            "JoiningDate":  "2024-01-01"
        })

        all_employees = client.get(
            "/api/employees/",
            headers=admin_headers
        ).json()

        if len(all_employees) > 0:
            emp_id   = all_employees[-1]["EmployeeID"]
            response = client.delete(
                f"/api/employees/{emp_id}",
                headers=admin_headers
            )
            assert response.status_code == 200

    def test_deactivate_employee_as_viewer(self, client, user_headers):
        # Test Case 27 — Viewer CANNOT deactivate employee
        response = client.delete(
            "/api/employees/1",
            headers=user_headers
        )
        assert response.status_code == 403


class TestEmployeeAssets:

    def test_get_employee_assets(self, client, admin_headers):
        # Test Case 28 — Get total assets for employee
        all_employees = client.get(
            "/api/employees/",
            headers=admin_headers
        ).json()

        if len(all_employees) > 0:
            emp_id   = all_employees[0]["EmployeeID"]
            response = client.get(
                f"/api/employees/{emp_id}/assets",
                headers=admin_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert "EmployeeName"     in data
            assert "TotalAssigned"    in data
            assert "CurrentlyHolding" in data
            assert "TotalReturned"    in data