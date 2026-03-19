from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract
from typing import Optional, List
from datetime import date
from app.database import get_db
from app.models.models import Holiday, HolidayPayment, EgyptDuty, EgyptBeneficiary, User
from app.schemas.schemas import HistoryItem
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/history", tags=["History"])


@router.get("/", response_model=List[HistoryItem])
def get_history(
    event_type: Optional[str] = None,
    member_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = []

    # Holidays
    if event_type is None or event_type == "holiday":
        hq = db.query(Holiday)
        if year:
            hq = hq.filter(extract("year", Holiday.date) == year)
        if month:
            hq = hq.filter(extract("month", Holiday.date) == month)
        if date_from:
            hq = hq.filter(Holiday.date >= date.fromisoformat(date_from))
        if date_to:
            hq = hq.filter(Holiday.date <= date.fromisoformat(date_to))
        if status == "validated":
            hq = hq.filter(Holiday.worked.isnot(None))
        elif status == "pending":
            hq = hq.filter(Holiday.worked.is_(None))

        holidays = hq.all()
        for h in holidays:
            payments = h.payments
            if member_id:
                payments = [p for p in payments if p.member_id == member_id]
                if not payments and h.worked:
                    continue

            members = [p.member.full_name for p in payments if p.member]
            total = sum(p.amount for p in payments)

            if h.worked is None:
                val_status = "En attente"
            elif h.worked:
                val_status = "Travaillé"
            else:
                val_status = "Non travaillé"

            items.append(HistoryItem(
                id=h.id,
                date=h.date,
                event_type="holiday",
                event_name=h.holiday_name,
                members=members if h.worked else [],
                amount_per_person=1000.0 if h.worked else 0,
                total_amount=total,
                validation_status=val_status,
                comment=h.comment,
                created_at=h.created_at,
                updated_at=h.updated_at,
            ))

    # Egypt duties
    if event_type is None or event_type == "egypt_duty":
        eq = db.query(EgyptDuty)
        if year:
            eq = eq.filter(extract("year", EgyptDuty.date) == year)
        if month:
            eq = eq.filter(extract("month", EgyptDuty.date) == month)
        if date_from:
            eq = eq.filter(EgyptDuty.date >= date.fromisoformat(date_from))
        if date_to:
            eq = eq.filter(EgyptDuty.date <= date.fromisoformat(date_to))

        duties = eq.all()
        for d in duties:
            beneficiaries = d.beneficiaries
            if member_id:
                beneficiaries = [b for b in beneficiaries if b.member_id == member_id]
                if not beneficiaries:
                    continue

            members = [b.member.full_name for b in beneficiaries if b.member]
            total = sum(b.amount for b in beneficiaries)

            items.append(HistoryItem(
                id=d.id,
                date=d.date,
                event_type="egypt_duty",
                event_name="Astreinte Égypte",
                members=members,
                amount_per_person=1000.0,
                total_amount=total,
                validation_status="Validé",
                comment=d.comment,
                created_at=d.created_at,
                updated_at=d.updated_at,
            ))

    items.sort(key=lambda x: x.date, reverse=True)
    return items
