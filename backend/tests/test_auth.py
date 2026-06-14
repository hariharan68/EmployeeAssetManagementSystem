import pytest


class TestRegister:

    def test_register_success(self, client):
        # Test Case 1 — New user registers successfully
        response = client.post("/api/auth/register", json={
            "username": "newuser",
            "email":    "newuser@test.com",
            "password": "Password@123",
            "role":     "User"
        })
        assert response.status_code == 201
        assert response.json()["message"] == "User registered successfully"

    def test_register_duplicate_email(self, client):
        # Test Case 2 — Same email cannot register twice
        # First registration
        client.post("/api/auth/register", json={
            "username": "user1",
            "email":    "duplicate@test.com",
            "password": "Password@123",
            "role":     "User"
        })

        # Second registration with same email
        response = client.post("/api/auth/register", json={
            "username": "user2",
            "email":    "duplicate@test.com",
            "password": "Password@123",
            "role":     "User"
        })
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    def test_register_duplicate_username(self, client):
        # Test Case 3 — Same username cannot register twice
        client.post("/api/auth/register", json={
            "username": "sameuser",
            "email":    "first@test.com",
            "password": "Password@123",
            "role":     "User"
        })

        response = client.post("/api/auth/register", json={
            "username": "sameuser",
            "email":    "second@test.com",
            "password": "Password@123",
            "role":     "User"
        })
        assert response.status_code == 400
        assert "already taken" in response.json()["detail"]

    def test_register_invalid_email(self, client):
        # Test Case 4 — Invalid email format is rejected
        response = client.post("/api/auth/register", json={
            "username": "baduser",
            "email":    "notanemail",
            "password": "Password@123",
            "role":     "User"
        })
        assert response.status_code == 422

    def test_register_missing_fields(self, client):
        # Test Case 5 — Missing required fields are rejected
        response = client.post("/api/auth/register", json={
            "username": "incomplete"
        })
        assert response.status_code == 422


class TestLogin:

    def test_login_success(self, client):
        # Test Case 6 — Valid credentials return token
        client.post("/api/auth/register", json={
            "username": "loginuser",
            "email":    "loginuser@test.com",
            "password": "Login@123",
            "role":     "Admin"
        })

        response = client.post("/api/auth/login", json={
            "email":    "loginuser@test.com",
            "password": "Login@123"
        })

        assert response.status_code == 200
        data = response.json()

        # Check all expected fields exist in response
        assert "access_token" in data
        assert "token_type"   in data
        assert "role"         in data
        assert "username"     in data

        # Token should not be empty
        assert len(data["access_token"]) > 0

        # Role should match what was registered
        assert data["role"]     == "Admin"
        assert data["username"] == "loginuser"

    def test_login_wrong_password(self, client):
        # Test Case 7 — Wrong password is rejected
        response = client.post("/api/auth/login", json={
            "email":    "loginuser@test.com",
            "password": "WrongPassword@123"
        })
        assert response.status_code == 401
        assert "Invalid" in response.json()["detail"]

    def test_login_wrong_email(self, client):
        # Test Case 8 — Non-existent email is rejected
        response = client.post("/api/auth/login", json={
            "email":    "nobody@test.com",
            "password": "Login@123"
        })
        assert response.status_code == 401

    def test_login_empty_password(self, client):
        # Test Case 9 — Empty password is rejected
        response = client.post("/api/auth/login", json={
            "email":    "loginuser@test.com",
            "password": ""
        })
        assert response.status_code in [400, 401, 422]

    def test_login_missing_email(self, client):
        # Test Case 10 — Missing email field is rejected
        response = client.post("/api/auth/login", json={
            "password": "Login@123"
        })
        assert response.status_code == 422


class TestProtectedRoutes:

    def test_me_with_valid_token(self, client, admin_headers):
        # Test Case 11 — Valid token returns user profile
        response = client.get("/api/auth/me", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "UserID"   in data
        assert "Username" in data
        assert "Email"    in data
        assert "Role"     in data

    def test_me_without_token(self, client):
        # Test Case 12 — No token is rejected with 403
        response = client.get("/api/auth/me")
        assert response.status_code == 401

    def test_me_with_invalid_token(self, client):
        # Test Case 13 — Fake token is rejected
        headers  = {"Authorization": "Bearer faketoken123"}
        response = client.get("/api/auth/me", headers=headers)
        assert response.status_code in [401, 403]

    def test_me_with_expired_token(self, client):
        # Test Case 14 — Expired token is rejected
        expired_token = (
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
            "eyJ1c2VyX2lkIjoxLCJleHAiOjE2MDAwMDAwMDB9."
            "invalid_signature"
        )
        headers  = {"Authorization": f"Bearer {expired_token}"}
        response = client.get("/api/auth/me", headers=headers)
        assert response.status_code in [401, 403]