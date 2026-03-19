from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, date
from app.database import get_db
from app.models.models import EgyptDuty, EgyptBeneficiary, TeamMember, Notification, User
from app.schemas.schemas import EgyptDutyCreate, EgyptDutyUpdate, EgyptDutyOut, EgyptBeneficiaryOut
from app.services.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/egypt-duty", tags=["Egypt Duty"])


def _duty_to_out(duty: EgyptDuty) -> dict:
    return {
        "id": duty.id,
        "date": duty.date,
        "comment": duty.comment,
        "validated_by": duty.validated_by,
        "validated_at": duty.validated_at,
        "created_at": duty.created_at,
        "updated_at": duty.updated_at,
        "beneficiaries": [
            {
                "id": b.id,
                "duty_id": b.duty_id,
                "member_id": b.member_id,
                "amount": b.amount,
                "member_name": b.member.full_name if b.member else None,
                "created_at": b.created_at,
            }
            for b in duty.beneficiaries
        ],
    }


@router.get("/", response_model=List[EgyptDutyOut])
def list_duties(
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(EgyptDuty)
    if year:
        from sqlalchemy import extract
        query = query.filter(extract("year", EgyptDuty.date) == year)
    if month:
        from sqlalchemy import extract
        query = query.filter(extract("month", EgyptDuty.date) == month)

    duties = query.order_by(EgyptDuty.date.desc()).all()
    return [_duty_to_out(d) for d in duties]


@router.get("/check-sunday/{check_date}")
def check_sunday(check_date: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = date.fromisoformat(check_date)
    is_sunday = d.weekday() == 6
    existing = db.query(EgyptDuty).filter(EgyptDuty.date == d).first()
    return {
        "is_sunday": is_sunday,
        "date": check_date,
        "already_declared": existing is not None,
        "duty_id": existing.id if existing else None,
    }


@router.get("/{duty_id}", response_model=EgyptDutyOut)
def get_duty(duty_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    duty = db.query(EgyptDuty).filter(EgyptDuty.id == duty_id).first()
    if not duty:
        raise HTTPException(status_code=404, detail="Astreinte non trouvée")
    return _duty_to_out(duty)


@router.post("/", response_model=EgyptDutyOut)
def create_duty(
    data: EgyptDutyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if len(data.member_ids) != 3:
        raise HTTPException(status_code=400, detail="Vous devez sélectionner exactement 3 personnes")

    # Check if date is a Sunday
    if data.date.weekday() != 6:
        raise HTTPException(status_code=400, detail="La date doit être un dimanche")

    existing = db.query(EgyptDuty).filter(EgyptDuty.date == data.date).first()
    if existing:
        raise HTTPException(status_code=400, detail="Une astreinte existe déjà pour ce dimanche")

    # Verify all members exist and are active
    for mid in data.member_ids:
        member = db.query(TeamMember).filter(TeamMember.id == mid, TeamMember.status == "active").first()
        if not member:
            raise HTTPException(status_code=400, detail=f"Membre {mid} non trouvé ou inactif")

    duty = EgyptDuty(
        date=data.date,
        comment=data.comment,
        validated_by=current_user.name,
        validated_at=datetime.utcnow(),
    )
    db.add(duty)
    db.flush()

    for mid in data.member_ids:
        beneficiary = EgyptBeneficiary(
            duty_id=duty.id,
            member_id=mid,
            amount=1000.0,
        )
        db.add(beneficiary)

    notification = Notification(
        type="egypt_duty",
        title="Astreinte Égypte validée",
        message=f"Astreinte du {data.date.isoformat()} validée avec 3 bénéficiaires",
        event_date=data.date,
    )
    db.add(notification)

    db.commit()
    db.refresh(duty)
    return _duty_to_out(duty)


@router.put("/{duty_id}", response_model=EgyptDutyOut)
def update_duty(
    duty_id: int,
    data: EgyptDutyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    duty = db.query(EgyptDuty).filter(EgyptDuty.id == duty_id).first()
    if not duty:
        raise HTTPException(status_code=404, detail="Astreinte non trouvée")

    if data.member_ids is not None:
        if len(data.member_ids) != 3:
            raise HTTPException(status_code=400, detail="Vous devez sélectionner exactement 3 personnes")

        for mid in data.member_ids:
            member = db.query(TeamMember).filter(TeamMember.id == mid, TeamMember.status == "active").first()
            if not member:
                raise HTTPException(status_code=400, detail=f"Membre {mid} non trouvé ou inactif")

        db.query(EgyptBeneficiary).filter(EgyptBeneficiary.duty_id == duty_id).delete()
        for mid in data.member_ids:
            beneficiary = EgyptBeneficiary(
                duty_id=duty_id,
                member_id=mid,
                amount=1000.0,
            )
            db.add(beneficiary)

    if data.comment is not None:
        duty.comment = data.comment

    duty.validated_by = current_user.name
    duty.validated_at = datetime.utcnow()

    notification = Notification(
        type="update",
        title="Astreinte Égypte modifiée",
        message=f"Astreinte du {duty.date.isoformat()} a été modifiée",
        event_date=duty.date,
    )
    db.add(notification)

    db.commit()
    db.refresh(duty)
    return _duty_to_out(duty)


@router.delete("/{duty_id}")
def delete_duty(
    duty_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    duty = db.query(EgyptDuty).filter(EgyptDuty.id == duty_id).first()
    if not duty:
        raise HTTPException(status_code=404, detail="Astreinte non trouvée")

    notification = Notification(
        type="update",
        title="Astreinte Égypte annulée",
        message=f"Astreinte du {duty.date.isoformat()} a été annulée",
        event_date=duty.date,
    )
    db.add(notification)

    db.delete(duty)
    db.commit()
    return {"detail": "Astreinte supprimée"}


@router.get("/sundays/{year}/{month}")
def get_sundays_in_month(
    year: int, month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all Sundays in a given month with their duty status."""
    import calendar
    cal = calendar.Calendar()
    sundays = []
    for day in cal.itermonthdays2(year, month):
        if day[0] != 0 and day[1] == 6:  # weekday 6 = Sunday
            d = date(year, month, day[0])
            existing = db.query(EgyptDuty).filter(EgyptDuty.date == d).first()
            sundays.append({
                "date": d.isoformat(),
                "declared": existing is not None,
                "duty_id": existing.id if existing else None,
            })
    return sundays
