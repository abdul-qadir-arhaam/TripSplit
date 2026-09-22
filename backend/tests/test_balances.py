import pytest


def test_balances_and_settlement_engine(client):
    # 1. Setup Owner (Qadir) and 3 registered members (Ahmed, Sahil, Rahul)
    users = {}
    tokens = {}
    headers = {}
    for name, email in [
        ("Qadir", "qadir@example.com"),
        ("Ahmed", "ahmed@example.com"),
        ("Sahil", "sahil@example.com"),
        ("Rahul", "rahul@example.com"),
    ]:
        res = client.post("/api/auth/register", json={
            "name": name,
            "email": email,
            "password": "password123"
        })
        user_data = res.json()["user"]
        token = res.json()["access_token"]
        users[name] = user_data
        tokens[name] = token
        headers[name] = {"Authorization": f"Bearer {token}"}

    # 2. Qadir creates trip with Ahmed, Sahil, Rahul
    other_ids = [users["Ahmed"]["id"], users["Sahil"]["id"], users["Rahul"]["id"]]
    res_trip = client.post("/api/trips", json={
        "name": "Kerala Backwaters",
        "destination": "Kochi & Alleppey",
        "budget": "10000.00",
        "currency": "INR",
        "member_user_ids": other_ids
    }, headers=headers["Qadir"])
    assert res_trip.status_code == 201
    trip_id = res_trip.json()["id"]

    # Fetch trip members to get member IDs
    res_members = client.get(f"/api/trips/{trip_id}", headers=headers["Qadir"])
    members = res_members.json()["members"]
    member_map = {m["display_name"]: m["id"] for m in members}

    # Check initially empty balances
    res_bal_empty = client.get(f"/api/trips/{trip_id}/balances", headers=headers["Qadir"])
    assert res_bal_empty.status_code == 200
    bal_empty = res_bal_empty.json()
    assert bal_empty["total_spent"] == "0.00"
    assert bal_empty["is_balanced"] is True
    assert len(bal_empty["settlement_suggestions"]) == 0
    assert all(b["status"] == "SETTLED" for b in bal_empty["balances"])

    # 3. PRD Example: Qadir pays ₹2,400 for dinner split equally among all 4 members
    res_exp1 = client.post(f"/api/trips/{trip_id}/expenses", json={
        "title": "Dinner at Fort Kochi",
        "amount": "2400.00",
        "category": "Food",
        "paid_by_member_id": member_map["Qadir"],
        "split_method": "EQUAL",
        "splits": [{"member_id": mid} for mid in member_map.values()]
    }, headers=headers["Qadir"])
    assert res_exp1.status_code == 201

    # 4. Check balances after Expense 1
    res_bal1 = client.get(f"/api/trips/{trip_id}/balances", headers=headers["Ahmed"])
    assert res_bal1.status_code == 200
    bal1 = res_bal1.json()

    assert bal1["total_spent"] == "2400.00"
    assert bal1["budget"] == "10000.00"
    assert bal1["remaining_budget"] == "7600.00"
    assert bal1["percentage_used"] == "24.00"
    assert bal1["is_balanced"] is True

    balances_by_name = {b["display_name"]: b for b in bal1["balances"]}
    # Qadir paid 2400, share 600 -> +1800 (RECEIVES)
    assert balances_by_name["Qadir"]["total_paid"] == "2400.00"
    assert balances_by_name["Qadir"]["total_share"] == "600.00"
    assert balances_by_name["Qadir"]["net_balance"] == "1800.00"
    assert balances_by_name["Qadir"]["status"] == "RECEIVES"

    # Others paid 0, share 600 -> -600 (OWES)
    for name in ["Ahmed", "Sahil", "Rahul"]:
        assert balances_by_name[name]["total_paid"] == "0.00"
        assert balances_by_name[name]["total_share"] == "600.00"
        assert balances_by_name[name]["net_balance"] == "-600.00"
        assert balances_by_name[name]["status"] == "OWES"

    # Minimized settlements: Ahmed, Sahil, Rahul each owe Qadir 600
    suggestions = bal1["settlement_suggestions"]
    assert len(suggestions) == 3
    for s in suggestions:
        assert s["to_member_name"] == "Qadir"
        assert s["amount"] == "600.00"
        assert s["from_member_name"] in ["Ahmed", "Sahil", "Rahul"]

    # 5. Ahmed pays ₹1200 for Houseboat Ride, split between Qadir and Ahmed (₹600 each)
    res_exp2 = client.post(f"/api/trips/{trip_id}/expenses", json={
        "title": "Houseboat Ride",
        "amount": "1200.00",
        "category": "Activities",
        "paid_by_member_id": member_map["Ahmed"],
        "split_method": "EQUAL",
        "splits": [
            {"member_id": member_map["Qadir"]},
            {"member_id": member_map["Ahmed"]},
        ]
    }, headers=headers["Ahmed"])
    assert res_exp2.status_code == 201

    # 6. Re-calculate balances
    res_bal2 = client.get(f"/api/trips/{trip_id}/balances", headers=headers["Qadir"])
    bal2 = res_bal2.json()
    assert bal2["total_spent"] == "3600.00"
    assert bal2["is_balanced"] is True

    balances2 = {b["display_name"]: b for b in bal2["balances"]}
    # Ahmed: paid 1200, share 600 + 600 = 1200 -> net: 0.00 (SETTLED!)
    assert balances2["Ahmed"]["net_balance"] == "0.00"
    assert balances2["Ahmed"]["status"] == "SETTLED"

    # Qadir: paid 2400, share 600 + 600 = 1200 -> net: +1200.00 (RECEIVES)
    assert balances2["Qadir"]["net_balance"] == "1200.00"
    assert balances2["Qadir"]["status"] == "RECEIVES"

    # Sahil & Rahul still owe 600 each
    assert balances2["Sahil"]["net_balance"] == "-600.00"
    assert balances2["Rahul"]["net_balance"] == "-600.00"

    # Suggestions now only include Sahil -> Qadir (600) and Rahul -> Qadir (600)
    suggestions2 = bal2["settlement_suggestions"]
    assert len(suggestions2) == 2
    from_names = {s["from_member_name"] for s in suggestions2}
    assert from_names == {"Sahil", "Rahul"}
    assert all(s["to_member_name"] == "Qadir" and s["amount"] == "600.00" for s in suggestions2)
