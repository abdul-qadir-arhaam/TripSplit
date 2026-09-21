def test_register_success(client):
    payload = {
        "name": "Qadir Khan",
        "email": "qadir@example.com",
        "password": "secretpassword123"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["name"] == "Qadir Khan"
    assert data["user"]["email"] == "qadir@example.com"
    assert "id" in data["user"]


def test_register_duplicate_email(client):
    payload = {
        "name": "Qadir Khan",
        "email": "qadir@example.com",
        "password": "secretpassword123"
    }
    # Register first time
    response1 = client.post("/api/auth/register", json=payload)
    assert response1.status_code == 201

    # Register second time with same email
    response2 = client.post("/api/auth/register", json=payload)
    assert response2.status_code == 409
    assert "already exists" in response2.json()["detail"]


def test_login_success(client):
    register_payload = {
        "name": "Ahmed Ali",
        "email": "ahmed@example.com",
        "password": "password123"
    }
    client.post("/api/auth/register", json=register_payload)

    login_payload = {
        "email": "ahmed@example.com",
        "password": "password123"
    }
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "ahmed@example.com"


def test_login_incorrect_password(client):
    register_payload = {
        "name": "Ahmed Ali",
        "email": "ahmed@example.com",
        "password": "password123"
    }
    client.post("/api/auth/register", json=register_payload)

    login_payload = {
        "email": "ahmed@example.com",
        "password": "wrongpassword"
    }
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 401


def test_get_me_authenticated(client):
    register_payload = {
        "name": "Sahil Verma",
        "email": "sahil@example.com",
        "password": "password123"
    }
    reg_res = client.post("/api/auth/register", json=register_payload)
    token = reg_res.json()["access_token"]

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Sahil Verma"
    assert response.json()["email"] == "sahil@example.com"


def test_get_me_unauthenticated(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_logout(client):
    register_payload = {
        "name": "Rahul Sharma",
        "email": "rahul@example.com",
        "password": "password123"
    }
    reg_res = client.post("/api/auth/register", json=register_payload)
    token = reg_res.json()["access_token"]

    response = client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert "Logged out" in response.json()["message"]
