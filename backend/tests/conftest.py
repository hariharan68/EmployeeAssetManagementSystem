import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def admin_token(client):
    client.post("/api/auth/register", json={
        "username": "testadmin",
        "email":    "testadmin@test.com",
        "password": "Test@1234",
        "role":     "Admin"
    })

    response = client.post("/api/auth/login", json={
        "email":    "testadmin@test.com",
        "password": "Test@1234"
    })

    assert response.status_code == 200, (
        f"Admin login failed: {response.json()}"
    )
    return response.json()["access_token"]


@pytest.fixture(scope="session")
def user_token(client):
    client.post("/api/auth/register", json={
        "username": "testviewer",
        "email":    "testviewer@test.com",
        "password": "Test@1234",
        "role":     "User"
    })

    response = client.post("/api/auth/login", json={
        "email":    "testviewer@test.com",
        "password": "Test@1234"
    })

    assert response.status_code == 200, (
        f"Viewer login failed: {response.json()}"
    )
    return response.json()["access_token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def user_headers(user_token):
    return {"Authorization": f"Bearer {user_token}"}