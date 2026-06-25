from fastapi.testclient import TestClient

def test_login_success(client: TestClient, test_db):
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "Akalya", "password": "90807"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_password(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "Akalya", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid username or password."

def test_login_invalid_user(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "Ghost", "password": "testpassword123"}
    )
    assert response.status_code == 401
