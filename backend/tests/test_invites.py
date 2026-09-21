import pytest


def test_invite_full_lifecycle(client):
    # 1. Register Owner and Stranger
    res_owner = client.post("/api/auth/register", json={
        "name": "Alice Organizer",
        "email": "alice@example.com",
        "password": "password123"
    })
    token_owner = res_owner.json()["access_token"]
    headers_owner = {"Authorization": f"Bearer {token_owner}"}

    res_stranger = client.post("/api/auth/register", json={
        "name": "Bob Explorer",
        "email": "bob@example.com",
        "password": "password123"
    })
    token_stranger = res_stranger.json()["access_token"]
    headers_stranger = {"Authorization": f"Bearer {token_stranger}"}

    # 2. Create Trip
    trip_payload = {
        "name": "Goa Beach Retreat",
        "destination": "Goa, India",
        "description": "Sun, sand and seafood.",
        "start_date": "2026-11-10",
        "end_date": "2026-11-15",
        "budget": "20000.00",
        "currency": "INR",
        "trip_type": "Vacation",
        "member_user_ids": []
    }
    trip_res = client.post("/api/trips", json=trip_payload, headers=headers_owner)
    assert trip_res.status_code == 201
    trip_id = trip_res.json()["id"]

    # 3. Stranger cannot generate invite (403)
    res_forbidden = client.post(
        f"/api/trips/{trip_id}/invites",
        json={"expires_in_days": 7},
        headers=headers_stranger
    )
    assert res_forbidden.status_code == 403

    # 4. Owner generates an invite
    invite_payload = {
        "expires_in_days": 14,
        "max_uses": 5,
        "require_approval": False
    }
    invite_res = client.post(f"/api/trips/{trip_id}/invites", json=invite_payload, headers=headers_owner)
    assert invite_res.status_code == 201
    invite_data = invite_res.json()
    invite_id = invite_data["id"]
    raw_token = invite_data["token"]
    assert raw_token is not None
    assert invite_data["use_count"] == 0
    assert invite_data["is_active"] is True
    assert invite_data["is_expired"] is False
    assert invite_data["max_uses"] == 5

    # 5. List invites for trip
    list_res = client.get(f"/api/trips/{trip_id}/invites", headers=headers_owner)
    assert list_res.status_code == 200
    invites_list = list_res.json()
    assert len(invites_list) == 1
    assert invites_list[0]["id"] == invite_id

    # 6. Active invite endpoint
    active_res = client.get(f"/api/trips/{trip_id}/invites/active", headers=headers_owner)
    assert active_res.status_code == 200
    assert active_res.json()["id"] == invite_id

    # 7. Public Preview (No Auth required)
    preview_res = client.get(f"/api/invites/{raw_token}")
    assert preview_res.status_code == 200
    preview_data = preview_res.json()
    assert preview_data["trip_id"] == trip_id
    assert preview_data["name"] == "Goa Beach Retreat"
    assert preview_data["owner_name"] == "Alice Organizer"
    assert preview_data["is_valid"] is True
    assert preview_data["is_expired"] is False

    # Preview with invalid token returns 404
    bad_preview = client.get("/api/invites/invalid_token_12345")
    assert bad_preview.status_code == 404

    # 8. Stranger joins via invite token
    join_res = client.post(f"/api/invites/{raw_token}/join", headers=headers_stranger)
    assert join_res.status_code == 200
    joined_trip = join_res.json()
    member_names = [m["display_name"] for m in joined_trip["members"]]
    assert "Bob Explorer" in member_names

    # Check that invite use count incremented
    active_after_join = client.get(f"/api/trips/{trip_id}/invites/active", headers=headers_owner)
    assert active_after_join.json()["use_count"] == 1

    # 9. Guest joins via invite token
    guest_join_res = client.post(
        f"/api/invites/{raw_token}/join-guest",
        json={"display_name": "Charlie Guest"}
    )
    assert guest_join_res.status_code == 200
    guest_data = guest_join_res.json()
    assert "guest_token" in guest_data
    assert guest_data["member"]["display_name"] == "Charlie Guest"
    assert guest_data["member"]["member_type"] == "GUEST"

    # Guest can now view the trip using their guest token
    guest_headers = {"Authorization": f"Bearer {guest_data['guest_token']}"}
    trip_view_res = client.get(f"/api/trips/{trip_id}", headers=guest_headers)
    assert trip_view_res.status_code == 200
    assert trip_view_res.json()["name"] == "Goa Beach Retreat"

    # Check use count is now 2
    active_after_guest = client.get(f"/api/trips/{trip_id}/invites/active", headers=headers_owner)
    assert active_after_guest.json()["use_count"] == 2

    # 10. Disable the invite
    disable_res = client.post(f"/api/trips/{trip_id}/invites/{invite_id}/disable", headers=headers_owner)
    assert disable_res.status_code == 200
    assert disable_res.json()["is_active"] is False

    # Preview reflects inactive status
    preview_disabled = client.get(f"/api/invites/{raw_token}")
    assert preview_disabled.status_code == 200
    assert preview_disabled.json()["is_valid"] is False

    # Attempt to join disabled invite fails
    guest_fail = client.post(
        f"/api/invites/{raw_token}/join-guest",
        json={"display_name": "Dave ShouldFail"}
    )
    assert guest_fail.status_code == 400

    # 11. Regenerate the invite
    regen_res = client.post(f"/api/trips/{trip_id}/invites/{invite_id}/regenerate", headers=headers_owner)
    assert regen_res.status_code == 200
    new_token = regen_res.json()["token"]
    assert new_token is not None
    assert new_token != raw_token
    assert regen_res.json()["is_active"] is True
    assert regen_res.json()["use_count"] == 0

    # Old token fails preview / join
    old_preview = client.get(f"/api/invites/{raw_token}")
    assert old_preview.status_code == 404

    # New token works for joining
    new_guest_res = client.post(
        f"/api/invites/{new_token}/join-guest",
        json={"display_name": "Diana NewGuest"}
    )
    assert new_guest_res.status_code == 200
    assert new_guest_res.json()["member"]["display_name"] == "Diana NewGuest"


def test_invite_max_uses_limit(client):
    # Register Owner and create trip
    res_owner = client.post("/api/auth/register", json={
        "name": "Limit Tester",
        "email": "limittester@example.com",
        "password": "password123"
    })
    token_owner = res_owner.json()["access_token"]
    headers_owner = {"Authorization": f"Bearer {token_owner}"}

    trip_res = client.post("/api/trips", json={
        "name": "Quick Trip",
        "destination": "Shimla",
        "currency": "INR",
        "trip_type": "Weekend"
    }, headers=headers_owner)
    trip_id = trip_res.json()["id"]

    # Generate invite with max_uses = 1
    inv_res = client.post(f"/api/trips/{trip_id}/invites", json={"max_uses": 1}, headers=headers_owner)
    token = inv_res.json()["token"]

    # First guest join succeeds
    res1 = client.post(f"/api/invites/{token}/join-guest", json={"display_name": "Guest One"})
    assert res1.status_code == 200

    # Second guest join should fail due to max_uses limit
    res2 = client.post(f"/api/invites/{token}/join-guest", json={"display_name": "Guest Two"})
    assert res2.status_code == 400
    assert "maximum uses" in res2.json()["detail"].lower()
