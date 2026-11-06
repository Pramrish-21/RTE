import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateDobEligibility,
  generateRegistrationId,
  validateParticipantNumber,
  maskIdentity,
  checkDuplicateRegistration,
  INELIGIBLE_DOB_MESSAGE,
} from './rules.ts';
import type { DobEligibilityRule, Registration } from '../types/index.ts';

test('DOB eligibility allows valid dates when rule is disabled or null', () => {
  const resultNull = validateDobEligibility('2006-05-12', null);
  assert.equal(resultNull.isEligible, true);

  const disabledRule: DobEligibilityRule = {
    id: 'r1',
    forum_id: null,
    min_dob: '2005-01-01',
    max_dob: '2010-12-31',
    blocked_dobs: ['2006-05-12'],
    blocked_ranges: [],
    is_enabled: false,
    created_at: new Date().toISOString(),
  };
  const resultDisabled = validateDobEligibility('2006-05-12', disabledRule);
  assert.equal(resultDisabled.isEligible, true);
});

test('DOB eligibility rejects blocked exact date with exact required message', () => {
  const rule: DobEligibilityRule = {
    id: 'r2',
    forum_id: 'forum-1',
    min_dob: '2004-01-01',
    max_dob: '2012-12-31',
    blocked_dobs: ['2007-08-15', '2008-01-01'],
    blocked_ranges: [],
    is_enabled: true,
    created_at: new Date().toISOString(),
  };

  const rejected = validateDobEligibility('2007-08-15', rule);
  assert.equal(rejected.isEligible, false);
  assert.equal(rejected.message, INELIGIBLE_DOB_MESSAGE);

  const allowed = validateDobEligibility('2007-08-16', rule);
  assert.equal(allowed.isEligible, true);
});

test('DOB eligibility rejects dates within blocked ranges', () => {
  const rule: DobEligibilityRule = {
    id: 'r3',
    forum_id: 'forum-1',
    blocked_dobs: [],
    blocked_ranges: [
      { start: '2006-01-01', end: '2006-06-30', reason: 'Previous cohort batch' }
    ],
    is_enabled: true,
    created_at: new Date().toISOString(),
  };

  const insideRange = validateDobEligibility('2006-03-15', rule);
  assert.equal(insideRange.isEligible, false);
  assert.equal(insideRange.message, INELIGIBLE_DOB_MESSAGE);

  const outsideRange = validateDobEligibility('2006-07-01', rule);
  assert.equal(outsideRange.isEligible, true);
});

test('DOB eligibility rejects dates outside min and max boundaries', () => {
  const rule: DobEligibilityRule = {
    id: 'r4',
    forum_id: null,
    min_dob: '2005-01-01',
    max_dob: '2010-12-31',
    blocked_dobs: [],
    blocked_ranges: [],
    is_enabled: true,
    created_at: new Date().toISOString(),
  };

  const tooEarly = validateDobEligibility('2004-12-31', rule);
  assert.equal(tooEarly.isEligible, false);
  assert.equal(tooEarly.message, INELIGIBLE_DOB_MESSAGE);

  const tooLate = validateDobEligibility('2011-01-01', rule);
  assert.equal(tooLate.isEligible, false);
  assert.equal(tooLate.message, INELIGIBLE_DOB_MESSAGE);

  const valid = validateDobEligibility('2007-05-20', rule);
  assert.equal(valid.isEligible, true);
});

test('generateRegistrationId creates unique ID with JSR-2026- prefix', () => {
  const id1 = generateRegistrationId();
  const id2 = generateRegistrationId();
  assert.match(id1, /^JSR-2026-[A-Z0-9]{5}$/);
  assert.match(id2, /^JSR-2026-[A-Z0-9]{5}$/);
  assert.notEqual(id1, id2);
});

test('validateParticipantNumber requires exactly 12 numeric digits', () => {
  assert.equal(validateParticipantNumber('123456789012'), true);
  assert.equal(validateParticipantNumber('1234 5678 9012'), true);
  assert.equal(validateParticipantNumber('12345678901'), false); // 11 digits
  assert.equal(validateParticipantNumber('1234567890123'), false); // 13 digits
  assert.equal(validateParticipantNumber('12345678901A'), false); // alphanumeric
});

test('maskIdentity correctly masks Aadhaar to last 4 digits only and preserves school ID', () => {
  assert.equal(maskIdentity('masked_aadhaar', '987654321098'), 'XXXX-XXXX-1098');
  assert.equal(maskIdentity('masked_aadhaar', '1098'), 'XXXX-XXXX-1098');
  assert.equal(maskIdentity('school_id', 'DPS-RKP-2026-99'), 'DPS-RKP-2026-99');
});

test('checkDuplicateRegistration detects duplicate participant ID and email for same forum', () => {
  const sampleRegistrations: Registration[] = [
    {
      id: 'reg-1',
      registration_number: 'JSR-2026-AB12C',
      forum_id: 'forum-robotics',
      forum_name: 'STEM & Robotics Conclave',
      user_id: 'user-1',
      full_name: 'Aarav Sharma',
      class_grade: 'Class 11',
      contact_number: '9876543210',
      email: 'aarav@example.com',
      date_of_birth: '2008-04-10',
      participant_id_number: '123456789012',
      masked_id_type: 'masked_aadhaar',
      masked_id_value: 'XXXX-XXXX-9012',
      status: 'confirmed',
      payment_status: 'verified',
      qr_verification_url: 'https://rte.org/verify/JSR-2026-AB12C',
      created_at: new Date().toISOString(),
    },
  ];

  const duplicatePid = checkDuplicateRegistration(
    sampleRegistrations,
    'forum-robotics',
    '123456789012',
    'other@example.com'
  );
  assert.equal(duplicatePid.isDuplicate, true);

  const duplicateEmail = checkDuplicateRegistration(
    sampleRegistrations,
    'forum-robotics',
    '999999999999',
    'aarav@example.com'
  );
  assert.equal(duplicateEmail.isDuplicate, true);

  const differentForum = checkDuplicateRegistration(
    sampleRegistrations,
    'forum-debate',
    '123456789012',
    'aarav@example.com'
  );
  assert.equal(differentForum.isDuplicate, false);
});
