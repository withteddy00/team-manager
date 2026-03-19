from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime


# ---- User Schemas ----
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "admin"


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ---- Team Member Schemas ----
class TeamMemberCreate(BaseModel):
    full_name: str
    position: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    status: str = "active"


class TeamMemberUpdate(BaseModel):
    full_name: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None


class TeamMemberOut(BaseModel):
    id: int
    full_name: str
    position: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---- Holiday Schemas ----
class HolidayCreate(BaseModel):
    date: date
    holiday_name: str
    country: str = "Morocco"
    auto_detected: bool = False
    comment: Optional[str] = None


class HolidayValidate(BaseModel):
    worked: bool
    comment: Optional[str] = None


class HolidayUpdate(BaseModel):
    holiday_name: Optional[str] = None
    worked: Optional[bool] = None
    comment: Optional[str] = None


class HolidayPaymentOut(BaseModel):
    id: int
    holiday_id: int
    member_id: int
    amount: float
    member_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class HolidayOut(BaseModel):
    id: int
    date: date
    holiday_name: str
    country: str
    auto_detected: bool
    worked: Optional[bool]
    comment: Optional[str]
    validated_by: Optional[str]
    validated_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    payments: List[HolidayPaymentOut] = []

    class Config:
        from_attributes = True


# ---- Egypt Duty Schemas ----
class EgyptDutyCreate(BaseModel):
    date: date
    member_ids: List[int]
    comment: Optional[str] = None


class EgyptDutyUpdate(BaseModel):
    member_ids: Optional[List[int]] = None
    comment: Optional[str] = None


class EgyptBeneficiaryOut(BaseModel):
    id: int
    duty_id: int
    member_id: int
    amount: float
    member_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class EgyptDutyOut(BaseModel):
    id: int
    date: date
    comment: Optional[str]
    validated_by: Optional[str]
    validated_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    beneficiaries: List[EgyptBeneficiaryOut] = []

    class Config:
        from_attributes = True


# ---- Notification Schemas ----
class NotificationOut(BaseModel):
    id: int
    type: str
    title: str
    message: Optional[str]
    event_date: Optional[date]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationUpdate(BaseModel):
    is_read: bool


# ---- History / Dashboard Schemas ----
class HistoryItem(BaseModel):
    id: int
    date: date
    event_type: str  # "holiday" or "egypt_duty"
    event_name: str
    members: List[str]
    amount_per_person: float
    total_amount: float
    validation_status: str
    comment: Optional[str]
    created_at: datetime
    updated_at: datetime


class DashboardStats(BaseModel):
    total_holidays_declared: int
    total_egypt_duties: int
    total_payments: float
    total_by_holiday: float
    total_by_egypt: float
    member_totals: List[dict]
    monthly_totals: List[dict]
    yearly_totals: List[dict]


# ---- Moroccan Holidays ----
class MoroccanHolidayInfo(BaseModel):
    date: date
    name: str
    auto_detected: bool = True
