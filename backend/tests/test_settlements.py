import pytest


def test_settlements_crud_and_balance_impact(client):
    # 1. Setup Owner (Aman) and Member (Bikash)
    users = {}
    tokens = {}
    headers = {}
    for name, email in [
        ("Aman", "aman@example.com"),
        ("Bikash", "bikash@example.com"),
        ("Stranger", "stranger@example.com"),
    ]:
        res = client.post("/api/auth/register", json={
            "name": name,
            "email": email,
            "password": "password123"
        })
        assert res.status_code == 201
        users[name] = res.json()["user"]
        tokens[name] = res.json()["access_token"]
        headers[name] = {"Authorization": f"Bearer {tokens[name]}"}

    # 2. Aman creates trip with Bikash
    res_trip = client.post("/api/trips", json={
        "name": "Goa Trip",
        "destination": "North Goa",
        "budget": "5000.00",
        "currency": "INR",
        "member_user_ids": [users["Bikash"]["id"]],
    }, headers=headers["Aman"])
    assert res_trip.status_code == 201
    trip_id = res_trip.json()["id"]

    # Fetch trip members
    res_members = client.get(f"/api/trips/{trip_id}", headers=headers["Aman"])
    members = res_members.json()["members"]
    member_map = {m["display_name"]: m["id"] for m in members}
    aman_id = member_map["Aman"]
    bikash_id = member_map["Bikash"]

    # 3. Aman pays 2,000 for both Aman and Bikash equally (1,000 each)
    res_exp = client.post(f"/api/trips/{trip_id}/expenses", json={
        "title": "Hotel Stay",
        "amount": "2000.00",
        "category": "Accommodation",
        "paid_by_member_id": aman_id,
        "split_method": "EQUAL",
        "splits": [{"member_id": aman_id}, {"member_id": bikash_id}],
    }, headers=headers["Aman"])
    assert res_exp.status_code == 201

    # Check balances: Aman is +1000, Bikash is -1000
    res_bal = client.get(f"/api/trips/{trip_id}/balances", headers=headers["Aman"])
    assert res_bal.status_code == 200
    bal_data = res_bal.json()
    b_map = {b["member_id"]: b for b in bal_data["balances"]}
    assert b_map[aman_id]["net_balance"] == "1000.00"
    assert b_map[aman_id]["status"] == "RECEIVES"
    assert b_map[bikash_id]["net_balance"] == "-1000.00"
    assert b_map[bikash_id]["status"] == "OWES"
    assert len(bal_data["settlement_suggestions"]) == 1
    assert bal_data["settlement_suggestions"][0]["amount"] == "1000.00"

    # 4. Stranger cannot view or record settlements
    res_stranger = client.post(f"/api/trips/{trip_id}/settlements", json={
        "from_member_id": bikash_id,
        "to_member_id": aman_id,
        "amount": "1000.00",
        "payment_method": "UPI",
    }, headers=headers["Stranger"])
    assert res_stranger.status_code == 403

    # 5. Member cannot settle with themselves
    res_self = client.post(f"/api/trips/{trip_id}/settlements", json={
        "from_member_id": bikash_id,
        "to_member_id": bikash_id,
        "amount": "500.00",
        "payment_method": "Cash",
    }, headers=headers["Bikash"])
    assert res_self.status_code == 400

    # 6. Bikash records a partial payment of ₹400 as PAID
    res_settle_paid = client.post(f"/api/trips/{trip_id}/settlements", json={
        "from_member_id": bikash_id,
        "to_member_id": aman_id,
        "amount": "400.00",
        "currency": "INR",
        "status": "PAID",
        "payment_method": "UPI",
        "notes": "UPI to Aman for hotel advance",
    }, headers=headers["Bikash"])
    assert res_settle_paid.status_code == 201
    settle1 = res_settle_paid.json()
    assert settle1["status"] == "PAID"
    assert settle1["from_member_name"] == "Bikash"
    assert settle1["to_member_name"] == "Aman"
    assert settle1["payment_date"] is not None

    # Check updated balances: Bikash owes 600 now, Aman receives 600
    res_bal_after = client.get(f"/api/trips/{trip_id}/balances", headers=headers["Aman"])
    b_map_after = {b["member_id"]: b for b in res_bal_after.json()["balances"]}
    assert b_map_after[bikash_id]["settlement_paid"] == "400.00"
    assert b_map_after[bikash_id]["net_balance"] == "-600.00"
    assert b_map_after[aman_id]["settlement_received"] == "400.00"
    assert b_map_after[aman_id]["net_balance"] == "600.00"
    assert res_bal_after.json()["settlement_suggestions"][0]["amount"] == "600.00"

    # 7. Bikash records a PENDING settlement of ₹600
    res_settle_pending = client.post(f"/api/trips/{trip_id}/settlements", json={
        "from_member_id": bikash_id,
        "to_member_id": aman_id,
        "amount": "600.00",
        "currency": "INR",
        "status": "PENDING",
        "payment_method": "Cash",
        "notes": "Will give cash at dinner",
    }, headers=headers["Bikash"])
    assert res_settle_pending.status_code == 201
    pending_id = res_settle_pending.json()["id"]

    # Pending settlements do NOT affect the net balance yet
    res_bal_pending_check = client.get(f"/api/trips/{trip_id}/balances", headers=headers["Aman"])
    b_map_check = {b["member_id"]: b for b in res_bal_pending_check.json()["balances"]}
    assert b_map_check[bikash_id]["net_balance"] == "-600.00"

    # Check settlements list and summary
    res_list = client.get(f"/api/trips/{trip_id}/settlements", headers=headers["Aman"])
    assert res_list.status_code == 200
    list_data = res_list.json()
    assert len(list_data["settlements"]) == 2
    assert list_data["summary"]["settled_count"] == 1
    assert list_data["summary"]["total_settled_amount"] == "400.00"
    assert list_data["summary"]["pending_count"] == 1
    assert list_data["summary"]["total_pending_amount"] == "600.00"

    # 8. Aman marks the pending settlement as PAID
    res_patch = client.patch(f"/api/trips/{trip_id}/settlements/{pending_id}", json={
        "status": "PAID",
        "notes": "Cash received",
    }, headers=headers["Aman"])
    assert res_patch.status_code == 200
    assert res_patch.json()["status"] == "PAID"

    # Balances are now fully settled!
    res_bal_final = client.get(f"/api/trips/{trip_id}/balances", headers=headers["Aman"])
    b_map_final = {b["member_id"]: b for b in res_bal_final.json()["balances"]}
    assert b_map_final[bikash_id]["net_balance"] == "0.00"
    assert b_map_final[bikash_id]["status"] == "SETTLED"
    assert b_map_final[aman_id]["net_balance"] == "0.00"
    assert b_map_final[aman_id]["status"] == "SETTLED"
    assert len(res_bal_final.json()["settlement_suggestions"]) == 0
    assert res_bal_final.json()["is_balanced"] is True

    # 9. Delete a settlement
    res_delete = client.delete(f"/api/trips/{trip_id}/settlements/{pending_id}", headers=headers["Aman"])
    assert res_delete.status_code == 204
