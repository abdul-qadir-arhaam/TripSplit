import pytest


def test_expense_management_flow(client):
    # 1. Setup Owner, Member, and Stranger
    res_owner = client.post("/api/auth/register", json={
        "name": "Expense Owner",
        "email": "expowner@example.com",
        "password": "password123"
    })
    token_owner = res_owner.json()["access_token"]
    owner_headers = {"Authorization": f"Bearer {token_owner}"}

    res_member = client.post("/api/auth/register", json={
        "name": "Expense Member",
        "email": "expmember@example.com",
        "password": "password123"
    })
    token_member = res_member.json()["access_token"]
    member_user_id = res_member.json()["user"]["id"]
    member_headers = {"Authorization": f"Bearer {token_member}"}

    res_stranger = client.post("/api/auth/register", json={
        "name": "Expense Stranger",
        "email": "expstranger@example.com",
        "password": "password123"
    })
    token_stranger = res_stranger.json()["access_token"]
    stranger_headers = {"Authorization": f"Bearer {token_stranger}"}

    # 2. Create trip with owner and member
    res_trip = client.post("/api/trips", json={
        "name": "Goa Trip",
        "destination": "Goa",
        "budget": "20000.00",
        "member_user_ids": [member_user_id]
    }, headers=owner_headers)
    assert res_trip.status_code == 201
    trip = res_trip.json()
    trip_id = trip["id"]
    
    # Also add a direct guest companion
    res_guest = client.post(f"/api/trips/{trip_id}/members/guest", json={
        "display_name": "Companion Guest"
    }, headers=owner_headers)
    assert res_guest.status_code == 200
    
    # Reload trip to get all 3 member IDs
    res_trip_detail = client.get(f"/api/trips/{trip_id}", headers=owner_headers)
    members = res_trip_detail.json()["members"]
    assert len(members) == 3
    m_owner = next(m for m in members if m["display_name"] == "Expense Owner")
    m_friend = next(m for m in members if m["display_name"] == "Expense Member")
    m_guest = next(m for m in members if m["display_name"] == "Companion Guest")

    # 3. EQUAL Split with odd cent remainder: ₹100.00 among 3 people
    res_equal = client.post(f"/api/trips/{trip_id}/expenses", json={
        "title": "Welcome Snacks",
        "amount": "100.00",
        "category": "Food",
        "paid_by_member_id": m_owner["id"],
        "split_method": "EQUAL",
        "splits": [
            {"member_id": m_owner["id"]},
            {"member_id": m_friend["id"]},
            {"member_id": m_guest["id"]},
        ]
    }, headers=owner_headers)
    assert res_equal.status_code == 201
    eq_data = res_equal.json()
    assert eq_data["title"] == "Welcome Snacks"
    assert eq_data["amount"] == "100.00"
    assert len(eq_data["splits"]) == 3
    # Check that sum of splits equals exactly 100.00
    split_sum = sum(float(s["amount"]) for s in eq_data["splits"])
    assert round(split_sum, 2) == 100.00
    # Remainder 0.01 cent distributed to first member (33.34, 33.33, 33.33)
    amounts = sorted([float(s["amount"]) for s in eq_data["splits"]], reverse=True)
    assert amounts == [33.34, 33.33, 33.33]

    # 4. EXACT Split: ₹1000.00 (valid & invalid)
    # 4a. Invalid: sum is 900 != 1000
    res_exact_invalid = client.post(f"/api/trips/{trip_id}/expenses", json={
        "title": "Scuba Diving",
        "amount": "1000.00",
        "category": "Activities",
        "paid_by_member_id": m_friend["id"],
        "split_method": "EXACT",
        "splits": [
            {"member_id": m_owner["id"], "amount": "400.00"},
            {"member_id": m_friend["id"], "amount": "500.00"},
        ]
    }, headers=member_headers)
    assert res_exact_invalid.status_code == 400
    assert "does not equal total amount" in res_exact_invalid.json()["detail"]

    # 4b. Valid exact split
    res_exact_valid = client.post(f"/api/trips/{trip_id}/expenses", json={
        "title": "Scuba Diving",
        "amount": "1000.00",
        "category": "Activities",
        "paid_by_member_id": m_friend["id"],
        "split_method": "EXACT",
        "splits": [
            {"member_id": m_owner["id"], "amount": "400.00"},
            {"member_id": m_friend["id"], "amount": "350.00"},
            {"member_id": m_guest["id"], "amount": "250.00"},
        ]
    }, headers=member_headers)
    assert res_exact_valid.status_code == 201

    # 5. PERCENTAGE Split: ₹2400.00 (50%, 25%, 25%)
    res_pct = client.post(f"/api/trips/{trip_id}/expenses", json={
        "title": "Resort Stay",
        "amount": "2400.00",
        "category": "Stay",
        "paid_by_member_id": m_owner["id"],
        "split_method": "PERCENTAGE",
        "splits": [
            {"member_id": m_owner["id"], "percentage": "50.00"},
            {"member_id": m_friend["id"], "percentage": "25.00"},
            {"member_id": m_guest["id"], "percentage": "25.00"},
        ]
    }, headers=owner_headers)
    assert res_pct.status_code == 201
    pct_data = res_pct.json()
    splits_by_member = {s["member_id"]: float(s["amount"]) for s in pct_data["splits"]}
    assert splits_by_member[m_owner["id"]] == 1200.00
    assert splits_by_member[m_friend["id"]] == 600.00
    assert splits_by_member[m_guest["id"]] == 600.00

    # 6. SHARES Split: ₹1200.00 with shares 2:1:1
    res_shares = client.post(f"/api/trips/{trip_id}/expenses", json={
        "title": "Beach Dinner",
        "amount": "1200.00",
        "category": "Food",
        "paid_by_member_id": m_friend["id"],
        "split_method": "SHARES",
        "splits": [
            {"member_id": m_owner["id"], "shares": "2"},
            {"member_id": m_friend["id"], "shares": "1"},
            {"member_id": m_guest["id"], "shares": "1"},
        ]
    }, headers=member_headers)
    assert res_shares.status_code == 201
    shares_data = res_shares.json()
    shares_splits = {s["member_id"]: float(s["amount"]) for s in shares_data["splits"]}
    assert shares_splits[m_owner["id"]] == 600.00
    assert shares_splits[m_friend["id"]] == 300.00
    assert shares_splits[m_guest["id"]] == 300.00

    # 7. List expenses with category filter & search
    res_list_all = client.get(f"/api/trips/{trip_id}/expenses", headers=member_headers)
    assert res_list_all.status_code == 200
    assert len(res_list_all.json()) == 4

    res_list_food = client.get(f"/api/trips/{trip_id}/expenses?category=Food", headers=member_headers)
    assert res_list_food.status_code == 200
    assert len(res_list_food.json()) == 2

    res_search = client.get(f"/api/trips/{trip_id}/expenses?search=Scuba", headers=member_headers)
    assert res_search.status_code == 200
    assert len(res_search.json()) == 1
    assert res_search.json()[0]["title"] == "Scuba Diving"

    # 8. Update expense
    expense_to_edit = res_shares.json()["id"]
    res_update = client.patch(
        f"/api/trips/{trip_id}/expenses/{expense_to_edit}",
        json={"title": "Candlelight Beach Dinner"},
        headers=member_headers
    )
    assert res_update.status_code == 200
    assert res_update.json()["title"] == "Candlelight Beach Dinner"

    # 9. Stranger is blocked (403)
    res_stranger_list = client.get(f"/api/trips/{trip_id}/expenses", headers=stranger_headers)
    assert res_stranger_list.status_code == 403

    # 10. Delete expense
    res_delete = client.delete(f"/api/trips/{trip_id}/expenses/{expense_to_edit}", headers=member_headers)
    assert res_delete.status_code == 200
    res_check = client.get(f"/api/trips/{trip_id}/expenses/{expense_to_edit}", headers=member_headers)
    assert res_check.status_code == 404
