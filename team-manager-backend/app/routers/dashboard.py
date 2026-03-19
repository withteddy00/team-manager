from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from typing import Optional
from app.database import get_db
from app.models.models import (
    Holiday, HolidayPayment, EgyptDuty, EgyptBeneficiary,
    TeamMember, User,
)
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Total holidays declared
    hq = db.query(Holiday)
    if year:
        hq = hq.filter(extract("year", Holiday.date) == year)
    total_holidays = hq.count()
    worked_holidays = hq.filter(Holiday.worked == True).count()

    # Total Egypt duties
    eq = db.query(EgyptDuty)
    if year:
        eq = eq.filter(extract("year", EgyptDuty.date) == year)
    total_egypt = eq.count()

    # Total payments by holiday
    hp_query = db.query(func.coalesce(func.sum(HolidayPayment.amount), 0))
    if year:
        hp_query = hp_query.join(Holiday).filter(extract("year", Holiday.date) == year)
    total_holiday_payments = hp_query.scalar() or 0

    # Total payments by egypt
    eb_query = db.query(func.coalesce(func.sum(EgyptBeneficiary.amount), 0))
    if year:
        eb_query = eb_query.join(EgyptDuty).filter(extract("year", EgyptDuty.date) == year)
    total_egypt_payments = eb_query.scalar() or 0

    total_payments = total_holiday_payments + total_egypt_payments

    # Member totals
    members = db.query(TeamMember).all()
    member_totals = []
    for m in members:
        hp_sum = db.query(func.coalesce(func.sum(HolidayPayment.amount), 0)).filter(
            HolidayPayment.member_id == m.id
        )
        if year:
            hp_sum = hp_sum.join(Holiday).filter(extract("year", Holiday.date) == year)
        holiday_total = hp_sum.scalar() or 0

        eb_sum = db.query(func.coalesce(func.sum(EgyptBeneficiary.amount), 0)).filter(
            EgyptBeneficiary.member_id == m.id
        )
        if year:
            eb_sum = eb_sum.join(EgyptDuty).filter(extract("year", EgyptDuty.date) == year)
        egypt_total = eb_sum.scalar() or 0

        member_totals.append({
            "member_id": m.id,
            "member_name": m.full_name,
            "status": m.status,
            "holiday_total": holiday_total,
            "egypt_total": egypt_total,
            "total": holiday_total + egypt_total,
        })

    member_totals.sort(key=lambda x: x["total"], reverse=True)

    # Monthly totals
    monthly_totals = []
    for month in range(1, 13):
        hp_month = db.query(func.coalesce(func.sum(HolidayPayment.amount), 0)).join(Holiday).filter(
            extract("month", Holiday.date) == month
        )
        eb_month = db.query(func.coalesce(func.sum(EgyptBeneficiary.amount), 0)).join(EgyptDuty).filter(
            extract("month", EgyptDuty.date) == month
        )
        if year:
            hp_month = hp_month.filter(extract("year", Holiday.date) == year)
            eb_month = eb_month.filter(extract("year", EgyptDuty.date) == year)

        hp_val = hp_month.scalar() or 0
        eb_val = eb_month.scalar() or 0

        month_names = ["", "Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"]
        monthly_totals.append({
            "month": month,
            "month_name": month_names[month],
            "holiday_total": hp_val,
            "egypt_total": eb_val,
            "total": hp_val + eb_val,
        })

    # Active members count
    active_members = db.query(TeamMember).filter(TeamMember.status == "active").count()
    total_members = db.query(TeamMember).count()

    return {
        "total_holidays_declared": total_holidays,
        "worked_holidays": worked_holidays,
        "total_egypt_duties": total_egypt,
        "total_payments": total_payments,
        "total_holiday_payments": total_holiday_payments,
        "total_egypt_payments": total_egypt_payments,
        "active_members": active_members,
        "total_members": total_members,
        "member_totals": member_totals,
        "monthly_totals": monthly_totals,
    }
