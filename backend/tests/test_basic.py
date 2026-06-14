def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "Employee Asset Management API is running"


def test_login_works(client):
    client.post("/api/auth/register", json={
        "username": "basictest",
        "email":    "basictest@test.com",
        "password": "Basic@1234",
        "role":     "Admin"
    })

    response = client.post("/api/auth/login", json={
        "email":    "basictest@test.com",
        "password": "Basic@1234"
    })

    print("Login response:", response.json())
    assert response.status_code == 200
    assert "access_token" in response.json()