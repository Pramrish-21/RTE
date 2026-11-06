import type { DobEligibilityRule, Registration } from '../types/index.ts';

/**
 * EXACT mandated eligibility rejection message.
 */
export const INELIGIBLE_DOB_MESSAGE = 'You are not allowed to take part because you are not attended our first event!';

/**
 * Validates Date of Birth eligibility against rules.
 * Handles:
 * - Disabled rules check (passes if rule is disabled or undefined)
 * - Specific blocked dates of birth
 * - Blocked date ranges (inclusive)
 * - Minimum DOB (student must be born on or after min_dob)
 * - Maximum DOB (student must be born on or before max_dob)
 * Returns { isEligible: boolean, message?: string }
 */
export function validateDobEligibility(
  dob: string | undefined | null,
  rule?: DobEligibilityRule | null
): { isEligible: boolean; message?: string } {
  if (!dob || typeof dob !== 'string') {
    return { isEligible: false, message: 'Please provide a valid Date of Birth.' };
  }

  const cleanDob = dob.trim();
  // Basic YYYY-MM-DD pattern check
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDob)) {
    return { isEligible: false, message: 'Date of Birth must be in YYYY-MM-DD format.' };
  }

  // If rule is missing or disabled, eligibility passes
  if (!rule || !rule.is_enabled) {
    return { isEligible: true };
  }

  // 1. Check blocked exact dates
  if (Array.isArray(rule.blocked_dobs) && rule.blocked_dobs.includes(cleanDob)) {
    return { isEligible: false, message: INELIGIBLE_DOB_MESSAGE };
  }

  // 2. Check blocked ranges (inclusive)
  if (Array.isArray(rule.blocked_ranges)) {
    for (const range of rule.blocked_ranges) {
      if (range.start && range.end) {
        if (cleanDob >= range.start && cleanDob <= range.end) {
          return { isEligible: false, message: INELIGIBLE_DOB_MESSAGE };
        }
      }
    }
  }

  // 3. Check min_dob (must not be earlier than min_dob)
  if (rule.min_dob && cleanDob < rule.min_dob) {
    return { isEligible: false, message: INELIGIBLE_DOB_MESSAGE };
  }

  // 4. Check max_dob (must not be later than max_dob)
  if (rule.max_dob && cleanDob > rule.max_dob) {
    return { isEligible: false, message: INELIGIBLE_DOB_MESSAGE };
  }

  return { isEligible: true };
}

/**
 * Generates unique Registration ID in format JSR-2026-XXXXX
 * Example: JSR-2026-K9P2X
 */
export function generateRegistrationId(prefix: string = 'JSR-2026'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing O, 0, I, 1
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}

/**
 * Validates 12-digit participant identification number (PID).
 * Must be exactly 12 numeric digits.
 */
export function validateParticipantNumber(pid: string): boolean {
  if (!pid) return false;
  const cleaned = pid.replace(/\s+/g, '');
  return /^\d{12}$/.test(cleaned);
}

/**
 * Masks identity string. For Aadhaar, never store full 12 digits, only last 4 digits.
 */
export function maskIdentity(type: 'school_id' | 'masked_aadhaar', value: string): string {
  const trimmed = (value || '').trim();
  if (type === 'masked_aadhaar') {
    const digitsOnly = trimmed.replace(/\D/g, '');
    const lastFour = digitsOnly.slice(-4);
    if (!lastFour || lastFour.length < 4) {
      return 'XXXX-XXXX-XXXX';
    }
    return `XXXX-XXXX-${lastFour}`;
  }
  return trimmed;
}

/**
 * Checks for duplicate registration for the same forum and participant.
 */
export function checkDuplicateRegistration(
  existingRegistrations: Registration[],
  forumId: string,
  participantIdNumber: string,
  email?: string
): { isDuplicate: boolean; reason?: string } {
  const cleanPid = (participantIdNumber || '').replace(/\s+/g, '');
  const cleanEmail = (email || '').trim().toLowerCase();

  const foundPid = existingRegistrations.find(
    (r) =>
      r.forum_id === forumId &&
      r.participant_id_number.replace(/\s+/g, '') === cleanPid &&
      r.status !== 'cancelled'
  );

  if (foundPid) {
    return {
      isDuplicate: true,
      reason: `Participant ID ${cleanPid} is already registered for this Forum (Reg ID: ${foundPid.registration_number}).`,
    };
  }

  if (cleanEmail) {
    const foundEmail = existingRegistrations.find(
      (r) =>
        r.forum_id === forumId &&
        r.email.trim().toLowerCase() === cleanEmail &&
        r.status !== 'cancelled'
    );
    if (foundEmail) {
      return {
        isDuplicate: true,
        reason: `Email ${cleanEmail} is already registered for this Forum (Reg ID: ${foundEmail.registration_number}).`,
      };
    }
  }

  return { isDuplicate: false };
}
