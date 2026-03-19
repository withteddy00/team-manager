from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, date
from app.database import get_db
from app.models.models import Holiday, HolidayPayment, TeamMember, Notification, User
from app.schemas.schemas import (
    HolidayCreate, HolidayValidate, HolidayUpdate, HolidayOut, HolidayPaymentOut,
    MoroccanHolidayInfo,
)
from app.services.auth import get_current_user, require_admin
from app.services.moroccan_holidays import get_all_moroccan_holidays, is_moroccan_holiday

router = APIRouter(prefix="/api/holidays", tags=["Holidays"])


def _holiday_to_out(holiday: Holiday) -> dict:
    data = {
        "id": holiday.id,
        "date": holiday.date,
        "holiday_name": holiday.holiday_name,
        "country": holiday.country,
        "auto_detected": holiday.auto_detected,
        "worked": holiday.worked,
        "comment": holiday.comment,
        "validated_by": holiday.validated_by,
        "validated_at": holiday.validated_at,
        "created_at": holiday.created_at,
        "updated_at": holiday.updated_at,
        "payments": [
            {
                "id": p.id,
                "holiday_id": p.holiday_id,
                "member_id": p.member_id,
                "amount": p.amount,
                "member_name": p.member.full_name if p.member else None,
                "created_at": p.created_at,
            }
            for p in holiday.payments
        ],
    }
    return data


@router.get("/moroccan/{year}", response_model=List[MoroccanHolidayInfo])
def get_moroccan_holidays(year: int, current_user: User = Depends(get_current_user)):
    holidays = get_all_moroccan_holidays(year)
    return [
        MoroccanHolidayInfo(
            date=date.fromisoformat(h["date"]),
            name=h["name"],
            auto_detected=True,
        )
        for h in holidays
    ]


@router.get("/", response_model=List[HolidayOut])
def list_holidays(
    year: Optional[int] = None,
    month: Optional[int] = None,
    worked: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Holiday)
    if year:
        from sqlalchemy import extract
        query = query.filter(extract("year", Holiday.date) == year)
    if month:
        from sqlalchemy import extract
        query = query.filter(extract("month", Holiday.date) == month)
    if worked is not None:
        query = query.filter(Holiday.worked == worked)

    holidays = query.order_by(Holiday.date.desc()).all()
    return [_holiday_to_out(h) for h in holidays]


@router.get("/{holiday_id}", response_model=HolidayOut)
def get_holiday(holiday_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Jour férié non trouvé")
    return _holiday_to_out(holiday)


@router.post("/", response_model=HolidayOut)
def create_holiday(
    data: HolidayCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    existing = db.query(Holiday).filter(Holiday.date == data.date).first()
    if existing:
        raise HTTPException(status_code=400, detail="Un jour férié existe déjà pour cette date")

    holiday = Holiday(
        date=data.date,
        holiday_name=data.holiday_name,
        country=data.country,
        auto_detected=data.auto_detected,
        comment=data.comment,
    )
    db.add(holiday)
    db.commit()
    db.refresh(holiday)

    notification = Notification(
        type="holiday",
        title="Nouveau jour férié ajouté",
        message=f"{data.holiday_name} le {data.date.isoformat()}",
        event_date=data.date,
    )
    db.add(notification)
    db.commit()

    return _holiday_to_out(holiday)


@router.post("/{holiday_id}/validate", response_model=HolidayOut)
def validate_holiday(
    holiday_id: int,
    data: HolidayValidate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Jour férié non trouvé")

    holiday.worked = data.worked
    holiday.comment = data.comment or holiday.comment
    holiday.validated_by = current_user.name
    holiday.validated_at = datetime.utcnow()

    # Remove existing payments
    db.query(HolidayPayment).filter(HolidayPayment.holiday_id == holiday_id).delete()

    if data.worked:
        active_members = db.query(TeamMember).filter(TeamMember.status == "active").all()
        for member in active_members:
            payment = HolidayPayment(
                holiday_id=holiday_id,
                member_id=member.id,
                amount=1000.0,
            )
            db.add(payment)

    db.commit()
    db.refresh(holiday)

    notification = Notification(
        type="validation",
        title="Jour férié validé",
        message=f"{holiday.holiday_name} - {'Travaillé' if data.worked else 'Non travaillé'}",
        event_date=holiday.date,
    )
    db.add(notification)
    db.commit()

    return _holiday_to_out(holiday)


@router.put("/{holiday_id}", response_model=HolidayOut)
def update_holiday(
    holiday_id: int,
    data: HolidayUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Jour férié non trouvé")

    update_data = data.model_dump(exclude_unset=True)

    if "worked" in update_data:
        holiday.worked = update_data["worked"]
        holiday.validated_by = current_user.name
        holiday.validated_at = datetime.utcnow()

        db.query(HolidayPayment).filter(HolidayPayment.holiday_id == holiday_id).delete()
        if update_data["worked"]:
            active_members = db.query(TeamMember).filter(TeamMember.status == "active").all()
            for member in active_members:
                payment = HolidayPayment(
                    holiday_id=holiday_id,
                    member_id=member.id,
                    amount=1000.0,
                )
                db.add(payment)

    if "holiday_name" in update_data:
        holiday.holiday_name = update_data["holiday_name"]
    if "comment" in update_data:
        holiday.comment = update_data["comment"]

    db.commit()
    db.refresh(holiday)
    return _holiday_to_out(holiday)


@router.delete("/{holiday_id}")
def delete_holiday(
    holiday_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Jour férié non trouvé")

    notification = Notification(
        type="update",
        title="Jour férié supprimé",
        message=f"{holiday.holiday_name} le {holiday.date.isoformat()} a été supprimé",
        event_date=holiday.date,
    )
    db.add(notification)

    db.delete(holiday)
    db.commit()
    return {"detail": "Jour férié supprimé"}


@router.post("/sync/{year}")
def sync_moroccan_holidays(
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Sync Moroccan holidays for a given year - auto-detect and create."""
    holidays_data = get_all_moroccan_holidays(year)
    created = 0

    for h in holidays_data:
        h_date = date.fromisoformat(h["date"])
        existing = db.query(Holiday).filter(Holiday.date == h_date).first()
        if not existing:
            holiday = Holiday(
                date=h_date,
                holiday_name=h["name"],
                country="Morocco",
                auto_detected=True,
            )
            db.add(holiday)
            created += 1

            notification = Notification(
                type="holiday",
                title="Jour férié détecté automatiquement",
                message=f"{h['name']} le {h['date']}",
                event_date=h_date,
            )
            db.add(notification)

    db.commit()
    return {"detail": f"{created} jours fériés synchronisés pour {year}"}
