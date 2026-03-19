from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models.models import TeamMember, User
from app.schemas.schemas import TeamMemberCreate, TeamMemberUpdate, TeamMemberOut
from app.services.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/team", tags=["Team"])


@router.get("/", response_model=List[TeamMemberOut])
def list_members(
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(TeamMember)
    if search:
        query = query.filter(TeamMember.full_name.ilike(f"%{search}%"))
    if status:
        query = query.filter(TeamMember.status == status)
    return query.order_by(TeamMember.full_name).all()


@router.get("/{member_id}", response_model=TeamMemberOut)
def get_member(member_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Membre non trouvé")
    return member


@router.post("/", response_model=TeamMemberOut)
def create_member(
    data: TeamMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    member = TeamMember(**data.model_dump())
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.put("/{member_id}", response_model=TeamMemberOut)
def update_member(
    member_id: int,
    data: TeamMemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Membre non trouvé")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(member, key, value)

    db.commit()
    db.refresh(member)
    return member


@router.delete("/{member_id}")
def delete_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Membre non trouvé")
    db.delete(member)
    db.commit()
    return {"detail": "Membre supprimé"}


@router.patch("/{member_id}/toggle-status", response_model=TeamMemberOut)
def toggle_status(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Membre non trouvé")
    member.status = "inactive" if member.status == "active" else "active"
    db.commit()
    db.refresh(member)
    return member
