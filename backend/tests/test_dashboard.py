import pytest
from datetime import datetime, timezone, timedelta


def test_dashboard_metrics_and_analytics(client):
    # 1. Setup Owner
    res = client.post("/api/auth/register", json={
        "name": "Sarah",
        "email": "sarah@example.com",
        "password": "password123"
    })
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Setup 2nd member
    res2 = client.post("/api/auth/register", json={
        "name": "John",
        "email": "john@example.com",
        "password": "password123"
    })
    john_user = res2.json()["user"]

    # 3. Create trip with budget ₹10,000
    today = datetime.now(timezone.utc).date()
    start_str = (today - timedelta(days=2)).isoformat()
    end_str = (today + timedelta(days=3)).isoformat()

    res_trip = client.post("/api/trips", json={
        "name": "Manali Trek",
        "destination": "Manali",
        "budget": "10000.00",
        "currency": "INR",
        "start_date": start_str,
        "end_date": end_str,
        "member_user_ids": [john_user["id"]],
    }, headers=headers)
    assert res_trip.status_code == 201
    trip_id = res_trip.json()["id"]

    # Fetch member IDs
    res_members = client.get(f"/api/trips/{trip_id}", headers=headers)
    members = res_members.json()["members"]
    member_map = {m["display_name"]: m["id"] for m in members}
    sarah_id = member_map["Sarah"]
    john_id = member_map["John"]

    # 4. Add multiple expenses across categories
    # Expense 1: Food ₹2,000
    client.post(f"/api/trips/{trip_id}/expenses", json={
        "title": "Mountain Cafe Breakfast",
        "amount": "2000.00",
        "category": "Food",
        "paid_by_member_id": sarah_id,
        "split_method": "EQUAL",
        "splits": [{"member_id": sarah_id}, {"member_id": john_id}],
    }, headers=headers)

    # Expense 2: Transport ₹5,000
    client.post(f"/api/trips/{trip_id}/expenses", json={
        "title": "Cab from Chandigarh",
        "amount": "5000.00",
        "category": "Transport",
        "paid_by_member_id": john_id,
        "split_method": "EQUAL",
        "splits": [{"member_id": sarah_id}, {"member_id": john_id}],
    }, headers=headers)

    # Expense 3: Activities ₹1,000
    client.post(f"/api/trips/{trip_id}/expenses", json={
        "title": "Paragliding Pass",
        "amount": "1000.00",
        "category": "Activities",
        "paid_by_member_id": sarah_id,
        "split_method": "EQUAL",
        "splits": [{"member_id": sarah_id}, {"member_id": john_id}],
    }, headers=headers)

    # 5. Fetch Dashboard
    res_dash = client.get(f"/api/trips/{trip_id}/dashboard", headers=headers)
    assert res_dash.status_code == 200
    dash = res_dash.json()

    # Verify Financials
    fin = dash["financials"]
    assert fin["total_spent"] == "8000.00"
    assert fin["total_budget"] == "10000.00"
    assert fin["remaining_budget"] == "2000.00"
    assert fin["percentage_used"] == "80.00"
    assert fin["budget_status"] == "CAUTION"  # 80% is between 75% and 100%
    assert fin["average_per_person"] == "4000.00"
    assert fin["total_days"] == 6

    # Verify Category Breakdown
    cat_breakdown = {c["category"]: c for c in dash["category_breakdown"]}
    assert "Transport" in cat_breakdown
    assert cat_breakdown["Transport"]["amount"] == "5000.00"
    assert cat_breakdown["Transport"]["percentage"] == "62.50"
    assert "Food" in cat_breakdown
    assert cat_breakdown["Food"]["amount"] == "2000.00"
    assert cat_breakdown["Food"]["percentage"] == "25.00"

    # Verify Largest Expenses
    assert len(dash["largest_expenses"]) == 3
    assert dash["largest_expenses"][0]["title"] == "Cab from Chandigarh"
    assert dash["largest_expenses"][0]["amount"] == "5000.00"

    # Verify Member Contributions
    assert len(dash["member_contributions"]) == 2
    # John paid 5000 (62.50%), Sarah paid 3000 (37.50%)
    m_by_id = {m["member_id"]: m for m in dash["member_contributions"]}
    assert m_by_id[john_id]["total_paid"] == "5000.00"
    assert m_by_id[sarah_id]["total_paid"] == "3000.00"
