def test_friends_flow(client):
    # Register User A
    res_a = client.post("/api/auth/register", json={
        "name": "User A",
        "email": "usera@example.com",
        "password": "password123"
    })
    token_a = res_a.json()["access_token"]
    user_a_id = res_a.json()["user"]["id"]

    # Register User B
    res_b = client.post("/api/auth/register", json={
        "name": "User B",
        "email": "userb@example.com",
        "password": "password123"
    })
    token_b = res_b.json()["access_token"]
    user_b_id = res_b.json()["user"]["id"]

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 1. Search users
    search_res = client.get("/api/users/search?q=User B", headers=headers_a)
    assert search_res.status_code == 200
    assert len(search_res.json()) >= 1
    assert search_res.json()[0]["id"] == user_b_id

    # 2. Send friend request from A to B
    send_res = client.post("/api/friends/requests", json={"receiver_id": user_b_id}, headers=headers_a)
    assert send_res.status_code == 201
    req_id = send_res.json()["id"]
    assert send_res.json()["status"] == "PENDING"

    # 3. Duplicate request should fail
    dup_res = client.post("/api/friends/requests", json={"receiver_id": user_b_id}, headers=headers_a)
    assert dup_res.status_code == 400

    # 4. Check pending requests for B
    pending_b = client.get("/api/friends/requests", headers=headers_b)
    assert pending_b.status_code == 200
    assert len(pending_b.json()["incoming"]) == 1
    assert pending_b.json()["incoming"][0]["id"] == req_id

    # 5. Accept friend request as B
    accept_res = client.post(f"/api/friends/requests/{req_id}/accept", headers=headers_b)
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "ACCEPTED"

    # 6. Both A and B should now see each other in friends list
    friends_a = client.get("/api/friends", headers=headers_a)
    assert len(friends_a.json()) == 1
    assert friends_a.json()[0]["id"] == user_b_id

    friends_b = client.get("/api/friends", headers=headers_b)
    assert len(friends_b.json()) == 1
    assert friends_b.json()[0]["id"] == user_a_id

    # 7. Remove friend
    del_res = client.delete(f"/api/friends/{user_b_id}", headers=headers_a)
    assert del_res.status_code == 200

    friends_a_after = client.get("/api/friends", headers=headers_a)
    assert len(friends_a_after.json()) == 0
