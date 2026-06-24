from fastapi.testclient import TestClient

def test_unauthorized_access(client: TestClient):
    # Trying to access protected route without token
    response = client.get("/api/v1/work/")
    assert response.status_code == 401

def test_create_work_task(client: TestClient, auth_headers):
    response = client.post(
        "/api/v1/work/",
        headers=auth_headers,
        json={
            "task_name": "Test automated testing",
            "project_name": "Dev",
            "deadline": "2026-12-31T23:59:59"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["task_name"] == "Test automated testing"
    assert data["status"] == "To Do"
    assert "id" in data

def test_get_work_tasks(client: TestClient, auth_headers):
    response = client.get("/api/v1/work/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["task_name"] == "Test automated testing"

def test_dashboard_analytics(client: TestClient, auth_headers):
    response = client.get("/api/v1/analytics/dashboard", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "productivity_score" in data
    assert "remaining_tasks" in data
    # Should include the task we just created
    assert len(data["remaining_tasks"]) >= 1
