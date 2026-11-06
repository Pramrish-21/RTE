export type UserRole = 'student' | 'admin' | 'main_admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  class_grade: string;
  contact_number: string;
  participant_id_number: string; // 12-digit PID
  date_of_birth: string; // YYYY-MM-DD
  masked_id_type: 'school_id' | 'masked_aadhaar';
  masked_id_value: string; // e.g. "SCH-98214" or "XXXX-XXXX-4589"
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  updated_at?: string;
}

export interface AdminRoleRecord {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'main_admin';
  granted_by?: string;
  created_at: string;
}

export interface Forum {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: 'STEM & Robotics' | 'Literature & Debate' | 'Computer Science' | 'Arts & Culture' | 'Business & Quiz';
  logo_url: string;
  banner_url: string;
  event_dates: string;
  venue: string;
  is_paid: boolean;
  registration_fee: number; // in INR
  upi_id?: string;
  payment_instructions?: string;
  registration_open_date: string;
  registration_close_date: string;
  status: 'open' | 'closed' | 'upcoming';
  max_capacity: number;
  registered_count: number;
  created_at: string;
}

export interface EventMasterInfo {
  id: string;
  title: string;
  tagline: string;
  event_dates: string; // "03 December 2026 – 06 December 2026"
  venue: string; // "Jamshedpur, Jharkhand, India"
  timezone: string; // "Asia/Kolkata (IST)"
  description: string;
  registration_open_date: string;
  registration_close_date: string;
  contact_email: string;
  contact_phone: string;
  organizer_name: string;
  website_url?: string;
  updated_at: string;
}

export type RegistrationStatus = 'confirmed' | 'pending_payment' | 'verified' | 'cancelled';
export type PaymentStatus = 'free' | 'pending_verification' | 'verified' | 'rejected';

export interface Registration {
  id: string;
  registration_number: string; // e.g., "JSR-2026-A8F2K"
  forum_id: string;
  forum_name: string;
  user_id: string;
  full_name: string;
  class_grade: string;
  contact_number: string;
  email: string;
  date_of_birth: string; // YYYY-MM-DD
  participant_id_number: string; // 12-digit
  masked_id_type: 'school_id' | 'masked_aadhaar';
  masked_id_value: string;
  status: RegistrationStatus;
  payment_status: PaymentStatus;
  payment_reference?: string;
  payment_notes?: string;
  qr_verification_url: string;
  created_at: string;
  verified_at?: string;
}

export interface DobEligibilityRule {
  id: string;
  forum_id: string | null; // null means global default rule
  min_dob?: string; // YYYY-MM-DD (e.g. at least 2005-01-01)
  max_dob?: string; // YYYY-MM-DD (e.g. no younger than 2012-12-31)
  blocked_dobs: string[]; // List of specific dates of birth blocked e.g. ["2008-04-15", "2007-11-20"]
  blocked_ranges: Array<{
    start: string; // YYYY-MM-DD
    end: string;   // YYYY-MM-DD
    reason?: string;
  }>;
  is_enabled: boolean;
  description?: string;
  created_at: string;
}

export interface ForumInvitationTemplate {
  id: string;
  forum_id: string;
  forum_name: string;
  organizer_logo_text: string;
  accent_color: string;
  formal_salutation: string;
  invitation_text: string;
  special_instructions: string;
  terms_and_conditions: string[];
  contact_phone: string;
  contact_email: string;
  signatory_name: string;
  signatory_designation: string;
}

export interface PaymentRecord {
  id: string;
  registration_id: string;
  registration_number: string;
  user_id: string;
  user_name: string;
  user_email: string;
  forum_id: string;
  forum_name: string;
  amount: number;
  transaction_ref: string;
  status: PaymentStatus;
  notes?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  target_forum_id?: string | null;
  is_published: boolean;
  published_at: string;
  created_at: string;
}

export interface InAppNotification {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  is_read: boolean;
  created_at: string;
}
