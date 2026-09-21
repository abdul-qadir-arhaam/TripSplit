def test_get_user_profile(client):
    register_payload = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "password": "securepassword123"
    }
    reg_res = client.post("/api/auth/register", json=register_payload)
    token = reg_res.json()["access_token"]

    response = client.get(
        "/api/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Jane Doe"
    assert data["email"] == "jane@example.com"
    assert data["profile_photo"] is None


def test_update_user_profile(client):
    register_payload = {
        "name": "John Doe",
        "email": "john@example.com",
        "password": "securepassword123"
    }
    reg_res = client.post("/api/auth/register", json=register_payload)
    token = reg_res.json()["access_token"]

    update_payload = {
        "name": "Johnathan Doe",
        "profile_photo": "https://example.com/photo.jpg"
    }
    patch_res = client.patch(
        "/api/users/me",
        json=update_payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert patch_res.status_code == 200
    updated_data = patch_res.json()
    assert updated_data["name"] == "Johnathan Doe"
    assert updated_data["profile_photo"] == "https://example.com/photo.jpg"
