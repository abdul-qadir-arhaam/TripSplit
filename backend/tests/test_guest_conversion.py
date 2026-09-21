def test_guest_join_access_and_session(client):
    # 1. Create trip owner and trip
    res_owner = client.post("/api/auth/register", json={
        "name": "Trip Host",
        "email": "triphost@example.com",
        "password": "password123"
    })
    token_owner = res_owner.json()["access_token"]
    headers_owner = {"Authorization": f"Bearer {token_owner}"}

    create_res = client.post("/api/trips", json={
        "name": "Goa Beach Holiday",
        "destination": "Goa, India",
        "budget": "25000.00",
        "trip_type": "Vacation"
    }, headers=headers_owner)
    assert create_res.status_code == 201
    trip_id = create_res.json()["id"]

    # 2. Guest joins trip via invite link without registering
    guest_join_res = client.post(f"/api/trips/{trip_id}/join-guest", json={
        "display_name": "Ahmed Guest"
    })
    assert guest_join_res.status_code == 200
    guest_data = guest_join_res.json()
    assert "guest_token" in guest_data
    guest_token = guest_data["guest_token"]
    assert guest_data["member"]["display_name"] == "Ahmed Guest"
    assert guest_data["member"]["member_type"] == "GUEST"
    assert guest_data["member"]["role"] == "MEMBER"
    assert guest_data["member"]["user_id"] is None

    headers_guest = {"Authorization": f"Bearer {guest_token}"}

    # 3. Guest can view their trip details
    trip_detail_res = client.get(f"/api/trips/{trip_id}", headers=headers_guest)
    assert trip_detail_res.status_code == 200
    detail_data = trip_detail_res.json()
    assert detail_data["name"] == "Goa Beach Holiday"
    # Both owner and guest are in the roster
    member_types = {m["display_name"]: m["member_type"] for m in detail_data["members"]}
    assert member_types["Ahmed Guest"] == "GUEST"
    assert member_types["Trip Host"] == "REGISTERED"

    # 4. Guest session info endpoint
    session_res = client.get(f"/api/trips/{trip_id}/guest-session", headers=headers_guest)
    assert session_res.status_code == 200
    assert session_res.json()["is_guest"] is True
    assert session_res.json()["member"]["display_name"] == "Ahmed Guest"


def test_guest_isolation(client):
    # Register owner
    res_owner = client.post("/api/auth/register", json={
        "name": "Owner User",
        "email": "isolationowner@example.com",
        "password": "password123"
    })
    token_owner = res_owner.json()["access_token"]
    headers_owner = {"Authorization": f"Bearer {token_owner}"}

    # Create Trip 1 and Trip 2
    t1 = client.post("/api/trips", json={
        "name": "Trip One",
        "destination": "Paris",
    }, headers=headers_owner).json()["id"]

    t2 = client.post("/api/trips", json={
        "name": "Trip Two",
        "destination": "Tokyo",
    }, headers=headers_owner).json()["id"]

    # Guest joins Trip 1
    guest_join = client.post(f"/api/trips/{t1}/join-guest", json={
        "display_name": "Isolated Guest"
    }).json()
    guest_token = guest_join["guest_token"]
    headers_guest = {"Authorization": f"Bearer {guest_token}"}

    # Guest can access Trip 1
    t1_res = client.get(f"/api/trips/{t1}", headers=headers_guest)
    assert t1_res.status_code == 200

    # Guest CANNOT access Trip 2 (403 Forbidden - strict isolation)
    t2_res = client.get(f"/api/trips/{t2}", headers=headers_guest)
    assert t2_res.status_code == 403
    assert "assigned trip" in t2_res.json()["detail"].lower()

    # Guest CANNOT access registered-only features (friends, groups, trips listing)
    friends_res = client.get("/api/friends", headers=headers_guest)
    assert friends_res.status_code == 401

    groups_res = client.get("/api/groups", headers=headers_guest)
    assert groups_res.status_code == 401

    all_trips_res = client.get("/api/trips", headers=headers_guest)
    assert all_trips_res.status_code == 401


def test_owner_add_direct_guest_member(client):
    res_owner = client.post("/api/auth/register", json={
        "name": "Organizer User",
        "email": "organizer@example.com",
        "password": "password123"
    })
    token_owner = res_owner.json()["access_token"]
    headers_owner = {"Authorization": f"Bearer {token_owner}"}

    trip_id = client.post("/api/trips", json={
        "name": "Himalayan Trek",
        "destination": "Kasol",
    }, headers=headers_owner).json()["id"]

    # Owner adds direct companion by name without an account
    add_guest_res = client.post(f"/api/trips/{trip_id}/members/guest", json={
        "display_name": "Sahil (Guest Companion)"
    }, headers=headers_owner)
    assert add_guest_res.status_code == 200

    trip_data = add_guest_res.json()
    guest_member = next((m for m in trip_data["members"] if m["display_name"] == "Sahil (Guest Companion)"), None)
    assert guest_member is not None
    assert guest_member["member_type"] == "GUEST"
    assert guest_member["user_id"] is None


def test_guest_to_account_conversion(client):
    # 1. Create trip and join as guest
    res_owner = client.post("/api/auth/register", json={
        "name": "Host User",
        "email": "hostuser@example.com",
        "password": "password123"
    })
    token_owner = res_owner.json()["access_token"]
    headers_owner = {"Authorization": f"Bearer {token_owner}"}

    trip_id = client.post("/api/trips", json={
        "name": "Kerala Backwaters",
        "destination": "Alleppey",
    }, headers=headers_owner).json()["id"]

    guest_join = client.post(f"/api/trips/{trip_id}/join-guest", json={
        "display_name": "Ahmed Guest"
    }).json()
    guest_token = guest_join["guest_token"]
    guest_member_id = guest_join["member"]["id"]
    headers_guest = {"Authorization": f"Bearer {guest_token}"}

    # 2. Guest converts to registered account
    convert_res = client.post(f"/api/trips/{trip_id}/convert-guest", json={
        "email": "ahmed.converted@example.com",
        "password": "strongpassword123",
        "name": "Ahmed Converted"
    }, headers=headers_guest)
    assert convert_res.status_code == 200
    convert_data = convert_res.json()

    assert "access_token" in convert_data
    assert convert_data["user"]["email"] == "ahmed.converted@example.com"
    assert convert_data["member"]["id"] == guest_member_id  # Preserves historical member ID
    assert convert_data["member"]["member_type"] == "REGISTERED"
    assert convert_data["member"]["user_id"] == convert_data["user"]["id"]

    new_token = convert_data["access_token"]
    headers_new_user = {"Authorization": f"Bearer {new_token}"}

    # 3. New registered user can access all registered features
    my_trips_res = client.get("/api/trips", headers=headers_new_user)
    assert my_trips_res.status_code == 200
    assert len(my_trips_res.json()) == 1
    assert my_trips_res.json()[0]["id"] == trip_id

    # 4. Old guest token is no longer accepted (converted/revoked)
    old_guest_access = client.get(f"/api/trips/{trip_id}", headers=headers_guest)
    assert old_guest_access.status_code == 401
