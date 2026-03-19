from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, Date, DateTime,
    ForeignKey, Text, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    viewer = "viewer"


class MemberStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(50), default="admin")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    position = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    holiday_payments = relationship("HolidayPayment", back_populates="member")
    egypt_beneficiaries = relationship("EgyptBeneficiary", back_populates="member")


class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    holiday_name = Column(String(255), nullable=False)
    country = Column(String(100), default="Morocco")
    auto_detected = Column(Boolean, default=True)
    worked = Column(Boolean, nullable=True)
    comment = Column(Text, nullable=True)
    validated_by = Column(String(255), nullable=True)
    validated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    payments = relationship("HolidayPayment", back_populates="holiday", cascade="all, delete-orphan")


class HolidayPayment(Base):
    __tablename__ = "holiday_payments"

    id = Column(Integer, primary_key=True, index=True)
    holiday_id = Column(Integer, ForeignKey("holidays.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("team_members.id"), nullable=False)
    amount = Column(Float, default=1000.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    holiday = relationship("Holiday", back_populates="payments")
    member = relationship("TeamMember", back_populates="holiday_payments")


class EgyptDuty(Base):
    __tablename__ = "egypt_duty"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    comment = Column(Text, nullable=True)
    validated_by = Column(String(255), nullable=True)
    validated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    beneficiaries = relationship("EgyptBeneficiary", back_populates="duty", cascade="all, delete-orphan")


class EgyptBeneficiary(Base):
    __tablename__ = "egypt_beneficiaries"

    id = Column(Integer, primary_key=True, index=True)
    duty_id = Column(Integer, ForeignKey("egypt_duty.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("team_members.id"), nullable=False)
    amount = Column(Float, default=1000.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    duty = relationship("EgyptDuty", back_populates="beneficiaries")
    member = relationship("TeamMember", back_populates="egypt_beneficiaries")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False)  # holiday, egypt_duty, validation, update
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    event_date = Column(Date, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
