def test_groups_flow(client):
    # Register Owner & Member
    res_owner = client.post("/api/auth/register", json={
        "name": "Group Owner",
        "email": "owner@example.com",
        "password": "password123"
    })
    token_owner = res_owner.json()["access_token"]
    owner_id = res_owner.json()["user"]["id"]

    res_user2 = client.post("/api/auth/register", json={
        "name": "Group Member User",
        "email": "memberuser@example.com",
        "password": "password123"
    })
    token_user2 = res_user2.json()["access_token"]
    user2_id = res_user2.json()["user"]["id"]

    headers_owner = {"Authorization": f"Bearer {token_owner}"}
    headers_user2 = {"Authorization": f"Bearer {token_user2}"}

    # 1. Create group
    create_res = client.post("/api/groups", json={"name": "College Buddies"}, headers=headers_owner)
    assert create_res.status_code == 201
    group_id = create_res.json()["id"]
    assert create_res.json()["name"] == "College Buddies"

    # 2. Add User 2 to group
    add_res = client.post(f"/api/groups/{group_id}/members", json={"user_id": user2_id}, headers=headers_owner)
    assert add_res.status_code == 200
    assert len(add_res.json()["members"]) == 2

    # 3. User 2 views group details
    detail_res = client.get(f"/api/groups/{group_id}", headers=headers_user2)
    assert detail_res.status_code == 200
    assert detail_res.json()["name"] == "College Buddies"

    # 4. User 2 (non-owner) cannot rename group
    bad_rename = client.patch(f"/api/groups/{group_id}", json={"name": "Hacked Group"}, headers=headers_user2)
    assert bad_rename.status_code == 403

    # 5. Owner renames group
    rename_res = client.patch(f"/api/groups/{group_id}", json={"name": "Weekend Hikers"}, headers=headers_owner)
    assert rename_res.status_code == 200
    assert rename_res.json()["name"] == "Weekend Hikers"

    # 6. Remove User 2 from group
    rm_res = client.delete(f"/api/groups/{group_id}/members/{user2_id}", headers=headers_owner)
    assert rm_res.status_code == 200
    assert len(rm_res.json()["members"]) == 1

    # 7. Delete group
    del_res = client.delete(f"/api/groups/{group_id}", headers=headers_owner)
    assert del_res.status_code == 200
