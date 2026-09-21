def test_trips_flow(client):
    # Register Owner, Member, and Stranger
    res_owner = client.post("/api/auth/register", json={
        "name": "Trip Owner",
        "email": "tripowner@example.com",
        "password": "password123"
    })
    token_owner = res_owner.json()["access_token"]

    res_member = client.post("/api/auth/register", json={
        "name": "Friend Member",
        "email": "friendmember@example.com",
        "password": "password123"
    })
    token_member = res_member.json()["access_token"]
    member_id = res_member.json()["user"]["id"]

    res_stranger = client.post("/api/auth/register", json={
        "name": "Stranger",
        "email": "stranger@example.com",
        "password": "password123"
    })
    token_stranger = res_stranger.json()["access_token"]

    headers_owner = {"Authorization": f"Bearer {token_owner}"}
    headers_member = {"Authorization": f"Bearer {token_member}"}
    headers_stranger = {"Authorization": f"Bearer {token_stranger}"}

    # 1. Create trip with initial friend member
    trip_payload = {
        "name": "Manali Adventure",
        "destination": "Manali, Himachal Pradesh",
        "description": "Snow, trekking and paragliding trip.",
        "start_date": "2026-10-01",
        "end_date": "2026-10-07",
        "budget": "35000.00",
        "currency": "INR",
        "trip_type": "Road Trip",
        "member_user_ids": [member_id]
    }
    create_res = client.post("/api/trips", json=trip_payload, headers=headers_owner)
    assert create_res.status_code == 201
    trip_data = create_res.json()
    trip_id = trip_data["id"]
    assert trip_data["name"] == "Manali Adventure"
    assert trip_data["budget"] == "35000.00"
    assert len(trip_data["members"]) == 2

    # Verify roles
    roles = {m["role"]: m for m in trip_data["members"]}
    assert "OWNER" in roles
    assert "MEMBER" in roles

    # 2. Member can list and see the trip
    trips_member = client.get("/api/trips", headers=headers_member)
    assert trips_member.status_code == 200
    assert len(trips_member.json()) == 1
    assert trips_member.json()[0]["id"] == trip_id

    # 3. Stranger cannot access trip details (403)
    stranger_res = client.get(f"/api/trips/{trip_id}", headers=headers_stranger)
    assert stranger_res.status_code == 403

    # 4. Stranger can preview trip via public invite info
    invite_res = client.get(f"/api/trips/{trip_id}/invite")
    assert invite_res.status_code == 200
    invite_info = invite_res.json()
    assert invite_info["name"] == "Manali Adventure"
    assert invite_info["destination"] == "Manali, Himachal Pradesh"
    assert invite_info["start_date"] == "2026-10-01"
    assert invite_info["end_date"] == "2026-10-07"
    assert invite_info["owner_name"] == "Trip Owner"
    assert invite_info["member_count"] == 2

    # 5. Stranger joins trip via invitation
    join_res = client.post(f"/api/trips/{trip_id}/join", headers=headers_stranger)
    assert join_res.status_code == 200
    assert len(join_res.json()["members"]) == 3

    # Now stranger has access to trip details
    stranger_access = client.get(f"/api/trips/{trip_id}", headers=headers_stranger)
    assert stranger_access.status_code == 200

    # 6. Member cannot update trip details (403)
    member_update = client.patch(f"/api/trips/{trip_id}", json={"budget": "50000.00"}, headers=headers_member)
    assert member_update.status_code == 403

    # 7. Owner updates trip budget and dates
    owner_update = client.patch(f"/api/trips/{trip_id}", json={
        "budget": "42000.00",
        "start_date": "2026-11-01",
        "end_date": "2026-11-10"
    }, headers=headers_owner)
    assert owner_update.status_code == 200
    assert owner_update.json()["budget"] == "42000.00"
    assert owner_update.json()["start_date"] == "2026-11-01"
    assert owner_update.json()["end_date"] == "2026-11-10"

    # 8. Owner deletes trip
    del_res = client.delete(f"/api/trips/{trip_id}", headers=headers_owner)
    assert del_res.status_code == 200

    # 9. Trip no longer exists
    get_res = client.get(f"/api/trips/{trip_id}", headers=headers_owner)
    assert get_res.status_code == 404
