export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface TeamMember {
  id: number;
  full_name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface HolidayPayment {
  id: number;
  holiday_id: number;
  member_id: number;
  amount: number;
  member_name: string | null;
  created_at: string;
}

export interface Holiday {
  id: number;
  date: string;
  holiday_name: string;
  country: string;
  auto_detected: boolean;
  worked: boolean | null;
  comment: string | null;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
  payments: HolidayPayment[];
}

export interface EgyptBeneficiary {
  id: number;
  duty_id: number;
  member_id: number;
  amount: number;
  member_name: string | null;
  created_at: string;
}

export interface EgyptDuty {
  id: number;
  date: string;
  comment: string | null;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
  beneficiaries: EgyptBeneficiary[];
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string | null;
  event_date: string | null;
  is_read: boolean;
  created_at: string;
}

export interface HistoryItem {
  id: number;
  date: string;
  event_type: string;
  event_name: string;
  members: string[];
  amount_per_person: number;
  total_amount: number;
  validation_status: string;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_holidays_declared: number;
  worked_holidays: number;
  total_egypt_duties: number;
  total_payments: number;
  total_holiday_payments: number;
  total_egypt_payments: number;
  active_members: number;
  total_members: number;
  member_totals: MemberTotal[];
  monthly_totals: MonthlyTotal[];
}

export interface MemberTotal {
  member_id: number;
  member_name: string;
  status: string;
  holiday_total: number;
  egypt_total: number;
  total: number;
}

export interface MonthlyTotal {
  month: number;
  month_name: string;
  holiday_total: number;
  egypt_total: number;
  total: number;
}

export interface MoroccanHolidayInfo {
  date: string;
  name: string;
  auto_detected: boolean;
}
