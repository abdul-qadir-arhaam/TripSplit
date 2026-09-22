from decimal import Decimal, ROUND_DOWN, ROUND_HALF_UP
from typing import List, Dict, Any, Set
from fastapi import HTTPException, status
from app.schemas.expense import SplitItemInput


class SplitCalculationResult:
    def __init__(self, member_id: str, amount: Decimal, split_value: Decimal = None):
        self.member_id = member_id
        self.amount = amount
        self.split_value = split_value


def calculate_and_validate_splits(
    amount: Decimal,
    split_method: str,
    splits_input: List[SplitItemInput],
    active_member_ids: Set[str],
) -> List[SplitCalculationResult]:
    """
    Validates and calculates exact allocations for an expense according to the chosen split method.
    Guarantees decimal-exact precision where sum(allocations) == amount.
    """
    amount = amount.quantize(Decimal("0.01"))
    if amount <= Decimal("0.00"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expense amount must be greater than 0.",
        )

    # 1. Determine participants and check membership
    if not splits_input:
        if split_method == "EQUAL":
            # Default to all active members of the trip
            participants = list(active_member_ids)
            splits_input = [SplitItemInput(member_id=mid) for mid in participants]
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Participants and allocations are required for split method {split_method}.",
            )

    participant_ids = [s.member_id for s in splits_input]
    if len(participant_ids) != len(set(participant_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate participants found in expense split.",
        )

    for mid in participant_ids:
        if mid not in active_member_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Participant {mid} is not an active member of this trip.",
            )

    n = len(splits_input)
    if n == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one participant must be included in the expense split.",
        )

    results: List[SplitCalculationResult] = []

    # 2. EQUAL Split
    if split_method == "EQUAL":
        base_share = (amount / Decimal(n)).quantize(Decimal("0.01"), rounding=ROUND_DOWN)
        remainder = amount - (base_share * Decimal(n))
        extra_cents = int((remainder * Decimal(100)).to_integral_value())

        for idx, item in enumerate(splits_input):
            allocated = base_share + (Decimal("0.01") if idx < extra_cents else Decimal("0.00"))
            results.append(SplitCalculationResult(item.member_id, allocated, Decimal("1.00")))

    # 3. EXACT Split
    elif split_method == "EXACT":
        total_exact = Decimal("0.00")
        for item in splits_input:
            if item.amount is None or item.amount < Decimal("0.00"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Exact amount missing or negative for participant {item.member_id}.",
                )
            exact_val = item.amount.quantize(Decimal("0.01"))
            total_exact += exact_val
            results.append(SplitCalculationResult(item.member_id, exact_val, exact_val))

        diff = amount - total_exact
        if diff != Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Exact allocations sum ({total_exact}) does not equal total amount ({amount}). Difference: {diff}.",
            )

    # 4. PERCENTAGE Split
    elif split_method == "PERCENTAGE":
        total_pct = Decimal("0.00")
        for item in splits_input:
            if item.percentage is None or item.percentage < Decimal("0.00"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Percentage missing or negative for participant {item.member_id}.",
                )
            total_pct += item.percentage

        if abs(total_pct - Decimal("100.00")) > Decimal("0.01"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Percentages must sum to 100%. Current sum: {total_pct}%.",
            )

        running_sum = Decimal("0.00")
        for item in splits_input:
            share_val = (amount * item.percentage / Decimal("100")).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            running_sum += share_val
            results.append(SplitCalculationResult(item.member_id, share_val, item.percentage))

        # Reconcile rounding remainder (e.g., +/- 1 cent)
        pct_diff = amount - running_sum
        if pct_diff != Decimal("0.00") and len(results) > 0:
            # Adjust the participant with the largest percentage
            max_item = max(results, key=lambda r: r.amount)
            max_item.amount += pct_diff

    # 5. SHARES Split
    elif split_method == "SHARES":
        total_shares = Decimal("0.00")
        for item in splits_input:
            if item.shares is None or item.shares <= Decimal("0.00"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Shares count missing or non-positive for participant {item.member_id}.",
                )
            total_shares += item.shares

        if total_shares <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Total shares must be greater than 0.",
            )

        running_sum = Decimal("0.00")
        for item in splits_input:
            share_val = (amount * item.shares / total_shares).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            running_sum += share_val
            results.append(SplitCalculationResult(item.member_id, share_val, item.shares))

        # Reconcile rounding remainder
        shares_diff = amount - running_sum
        if shares_diff != Decimal("0.00") and len(results) > 0:
            max_item = max(results, key=lambda r: r.amount)
            max_item.amount += shares_diff

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported split method: {split_method}",
        )

    # Final invariant check: sum(results.amount) must EXACTLY equal amount
    final_sum = sum(r.amount for r in results)
    if final_sum != amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Internal split error: computed sum ({final_sum}) != target ({amount}).",
        )

    return results
