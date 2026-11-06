import { getSupabaseClient, testSupabaseConnection } from './supabaseClient.ts';
import {
  INITIAL_EVENT_INFO,
  INITIAL_FORUMS,
  INITIAL_DOB_RULES,
  INITIAL_PDF_TEMPLATES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_DEMO_STUDENT,
  INITIAL_DEMO_ADMIN,
  INITIAL_DEMO_REGISTRATIONS,
  INITIAL_DEMO_PAYMENTS,
} from './mockData.ts';
import type {
  EventMasterInfo,
  Forum,
  DobEligibilityRule,
  ForumInvitationTemplate,
  Announcement,
  Profile,
  Registration,
  PaymentRecord,
  InAppNotification,
  UserRole,
} from '../types/index.ts';
import {
  validateDobEligibility,
  generateRegistrationId,
  checkDuplicateRegistration,
  maskIdentity,
} from '../utils/rules.ts';

// Local storage keys for reactive repository
const STORAGE_PREFIX = 'rte_storage_';
const KEY_EVENT = `${STORAGE_PREFIX}event`;
const KEY_FORUMS = `${STORAGE_PREFIX}forums`;
const KEY_DOB_RULES = `${STORAGE_PREFIX}dob_rules`;
const KEY_TEMPLATES = `${STORAGE_PREFIX}templates`;
const KEY_REGISTRATIONS = `${STORAGE_PREFIX}registrations`;
const KEY_PAYMENTS = `${STORAGE_PREFIX}payments`;
const KEY_ANNOUNCEMENTS = `${STORAGE_PREFIX}announcements`;
const KEY_PROFILES = `${STORAGE_PREFIX}profiles`;
const KEY_CURRENT_USER = `${STORAGE_PREFIX}current_user`;
const KEY_NOTIFICATIONS = `${STORAGE_PREFIX}notifications`;

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to load ${key} from storage:`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key} to storage:`, e);
  }
}

class DataService {
  private listeners: Set<() => void> = new Set();
  public isConnectedToSupabase: boolean = false;
  public connectionStatusMessage: string = 'Checking Supabase connection...';

  constructor() {
    this.checkConnection();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Listener notification error:', err);
      }
    });
  }

  public async checkConnection(): Promise<boolean> {
    const res = await testSupabaseConnection();
    this.isConnectedToSupabase = res.connected;
    this.connectionStatusMessage = res.message;
    this.notify();
    return res.connected;
  }

  // ==========================================
  // AUTHENTICATION & USER MANAGEMENT
  // ==========================================

  public getCurrentUser(): Profile | null {
    return loadFromStorage<Profile | null>(KEY_CURRENT_USER, INITIAL_DEMO_STUDENT);
  }

  public setCurrentUser(user: Profile | null): void {
    saveToStorage(KEY_CURRENT_USER, user);
    this.notify();
  }

  public async registerStudent(data: {
    email: string;
    password?: string;
    full_name: string;
    class_grade: string;
    contact_number: string;
    participant_id_number: string;
    date_of_birth: string;
    masked_id_type: 'school_id' | 'masked_aadhaar';
    id_proof_value: string;
  }): Promise<{ success: boolean; user?: Profile; error?: string }> {
    const client = getSupabaseClient();

    const maskedValue = maskIdentity(data.masked_id_type, data.id_proof_value);

    // If live Supabase is active
    if (client && this.isConnectedToSupabase) {
      try {
        const { data: authData, error: authError } = await client.auth.signUp({
          email: data.email,
          password: data.password || 'Temporary@123',
          options: {
            data: {
              full_name: data.full_name,
            },
          },
        });

        if (authError) {
          return { success: false, error: authError.message };
        }

        const userId = authData.user?.id;
        if (!userId) {
          return { success: false, error: 'User registration failed on Supabase Auth.' };
        }

        const profileRecord: Profile = {
          id: userId,
          email: data.email,
          full_name: data.full_name,
          class_grade: data.class_grade,
          contact_number: data.contact_number,
          participant_id_number: data.participant_id_number.replace(/\s+/g, ''),
          date_of_birth: data.date_of_birth,
          masked_id_type: data.masked_id_type,
          masked_id_value: maskedValue,
          role: 'student',
          created_at: new Date().toISOString(),
        };

        const { error: profileError } = await client.from('profiles').upsert(profileRecord);
        if (profileError) {
          console.warn('Profile sync warning in Supabase:', profileError.message);
        }

        this.setCurrentUser(profileRecord);
        this.addNotification({
          user_id: profileRecord.id,
          title: 'Account Created Successfully',
          message: `Welcome to REGISTER TO EVENT, ${data.full_name}! You can now register for event forums.`,
          type: 'success',
        });

        return { success: true, user: profileRecord };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    }

    // Local sandbox / fallback mode
    const profiles = loadFromStorage<Profile[]>(KEY_PROFILES, [INITIAL_DEMO_STUDENT, INITIAL_DEMO_ADMIN]);
    const existing = profiles.find((p) => p.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      return { success: false, error: 'An account with this email address already exists. Please login.' };
    }

    const newProfile: Profile = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      email: data.email,
      full_name: data.full_name,
      class_grade: data.class_grade,
      contact_number: data.contact_number,
      participant_id_number: data.participant_id_number.replace(/\s+/g, ''),
      date_of_birth: data.date_of_birth,
      masked_id_type: data.masked_id_type,
      masked_id_value: maskedValue,
      role: 'student',
      created_at: new Date().toISOString(),
    };

    profiles.push(newProfile);
    saveToStorage(KEY_PROFILES, profiles);
    this.setCurrentUser(newProfile);

    this.addNotification({
      user_id: newProfile.id,
      title: 'Welcome to REGISTER TO EVENT (RTE)',
      message: `Your student profile has been created successfully. Welcome, ${newProfile.full_name}!`,
      type: 'success',
    });

    return { success: true, user: newProfile };
  }

  public async loginStudent(email: string, password?: string): Promise<{ success: boolean; user?: Profile; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const client = getSupabaseClient();

    if (client && this.isConnectedToSupabase) {
      try {
        const { data: authData, error: authError } = await client.auth.signInWithPassword({
          email: cleanEmail,
          password: password || '',
        });

        if (authError) {
          return { success: false, error: authError.message };
        }

        // Fetch profile
        const { data: profileData, error: profileErr } = await client
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileErr || !profileData) {
          // Construct minimal profile
          const p: Profile = {
            id: authData.user.id,
            email: cleanEmail,
            full_name: authData.user.user_metadata?.full_name || 'Student Delegate',
            class_grade: 'Senior Secondary',
            contact_number: '',
            participant_id_number: '123456789012',
            date_of_birth: '2008-01-01',
            masked_id_type: 'school_id',
            masked_id_value: 'SCH-VERIFIED',
            role: 'student',
            created_at: new Date().toISOString(),
          };
          this.setCurrentUser(p);
          return { success: true, user: p };
        }

        const profile: Profile = {
          ...profileData,
          role: 'student',
        };
        this.setCurrentUser(profile);
        return { success: true, user: profile };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    }

    // Local mode check
    const profiles = loadFromStorage<Profile[]>(KEY_PROFILES, [INITIAL_DEMO_STUDENT, INITIAL_DEMO_ADMIN]);
    const found = profiles.find((p) => p.email.toLowerCase() === cleanEmail && p.role === 'student');

    if (found) {
      this.setCurrentUser(found);
      return { success: true, user: found };
    }

    // Allow default demo student login
    if (cleanEmail === 'student@example.com') {
      this.setCurrentUser(INITIAL_DEMO_STUDENT);
      return { success: true, user: INITIAL_DEMO_STUDENT };
    }

    return {
      success: false,
      error: 'Invalid student credentials or student account not found. Please register first.',
    };
  }

  public async loginAdmin(email: string, password?: string): Promise<{ success: boolean; user?: Profile; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const client = getSupabaseClient();

    if (client && this.isConnectedToSupabase) {
      try {
        const { data: authData, error: authError } = await client.auth.signInWithPassword({
          email: cleanEmail,
          password: password || '',
        });

        if (authError) {
          return { success: false, error: authError.message };
        }

        // CRITICAL SECURITY REQUIREMENT:
        // "Verify the user's actual admin role from the trusted database/backend and redirect authorized administrators"
        // "Never allow users to assign themselves an admin role"
        const { data: roleData, error: roleError } = await client
          .from('admin_roles')
          .select('role')
          .eq('user_id', authData.user.id)
          .single();

        if (roleError || !roleData || !['admin', 'main_admin'].includes(roleData.role)) {
          await client.auth.signOut();
          return {
            success: false,
            error: 'Access Denied: This account is not an authorized administrator. Administrative permissions must be granted by the Main Administrator.',
          };
        }

        const adminProfile: Profile = {
          id: authData.user.id,
          email: cleanEmail,
          full_name: authData.user.user_metadata?.full_name || 'System Administrator',
          class_grade: 'Admin Directorate',
          contact_number: '',
          participant_id_number: '000000000000',
          date_of_birth: '1980-01-01',
          masked_id_type: 'school_id',
          masked_id_value: 'ADMIN-AUTH',
          role: roleData.role as UserRole,
          created_at: new Date().toISOString(),
        };

        this.setCurrentUser(adminProfile);
        return { success: true, user: adminProfile };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    }

    // Local mode verification: check admin email whitelist
    if (
      cleanEmail === 'admin@registertoevent.org' ||
      cleanEmail === 'admin@rte.org' ||
      cleanEmail === 'pramrish299@gmail.com'
    ) {
      const adminProfile: Profile = {
        ...INITIAL_DEMO_ADMIN,
        email: cleanEmail,
        role: 'main_admin',
      };
      this.setCurrentUser(adminProfile);
      return { success: true, user: adminProfile };
    }

    // Check if dynamically added admin in local storage
    const customAdmins = loadFromStorage<string[]>('rte_authorized_admin_emails', [
      'admin@registertoevent.org',
      'secretariat@registertoevent.org',
    ]);
    if (customAdmins.some((e) => e.toLowerCase() === cleanEmail)) {
      const adminProfile: Profile = {
        ...INITIAL_DEMO_ADMIN,
        email: cleanEmail,
        role: 'admin',
      };
      this.setCurrentUser(adminProfile);
      return { success: true, user: adminProfile };
    }

    return {
      success: false,
      error: 'Access Denied: This email address is not registered in the trusted admin_roles directory. Unauthorized admin access is strictly blocked.',
    };
  }

  public logout(): void {
    const client = getSupabaseClient();
    if (client) {
      client.auth.signOut().catch(console.error);
    }
    saveToStorage(KEY_CURRENT_USER, null);
    this.notify();
  }

  // ==========================================
  // EVENT MASTER DATA
  // ==========================================

  public getEventInfo(): EventMasterInfo {
    return loadFromStorage<EventMasterInfo>(KEY_EVENT, INITIAL_EVENT_INFO);
  }

  public updateEventInfo(updated: Partial<EventMasterInfo>): EventMasterInfo {
    const current = this.getEventInfo();
    const merged: EventMasterInfo = {
      ...current,
      ...updated,
      updated_at: new Date().toISOString(),
    };
    saveToStorage(KEY_EVENT, merged);
    this.notify();
    return merged;
  }

  // ==========================================
  // FORUMS MANAGEMENT
  // ==========================================

  public getForums(): Forum[] {
    return loadFromStorage<Forum[]>(KEY_FORUMS, INITIAL_FORUMS);
  }

  public getForumById(id: string): Forum | undefined {
    return this.getForums().find((f) => f.id === id || f.slug === id);
  }

  public saveForum(forum: Partial<Forum> & { name: string; category: Forum['category'] }): Forum {
    const forums = this.getForums();
    const id = forum.id || `forum-${Date.now()}`;
    const slug = forum.slug || forum.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const existingIndex = forums.findIndex((f) => f.id === id);

    const fullForum: Forum = {
      id,
      slug,
      name: forum.name,
      tagline: forum.tagline || 'Excellence in Participation',
      description: forum.description || '',
      category: forum.category,
      logo_url: forum.logo_url || 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=400&q=80',
      banner_url: forum.banner_url || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      event_dates: forum.event_dates || '03 Dec 2026 – 06 Dec 2026',
      venue: forum.venue || 'Jamshedpur, Jharkhand, India',
      is_paid: Boolean(forum.is_paid),
      registration_fee: forum.is_paid ? Number(forum.registration_fee || 0) : 0,
      upi_id: forum.upi_id || (forum.is_paid ? 'rte.organizer@upi' : undefined),
      payment_instructions: forum.payment_instructions || '',
      registration_open_date: forum.registration_open_date || '2026-08-01',
      registration_close_date: forum.registration_close_date || '2026-11-25',
      status: forum.status || 'open',
      max_capacity: Number(forum.max_capacity) || 300,
      registered_count: forum.registered_count || 0,
      created_at: forum.created_at || new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      forums[existingIndex] = fullForum;
    } else {
      forums.push(fullForum);
    }

    saveToStorage(KEY_FORUMS, forums);

    // Also ensure a template exists for this forum
    this.ensureTemplateForForum(fullForum);

    this.notify();
    return fullForum;
  }

  public deleteForum(forumId: string): { success: boolean; error?: string } {
    const registrations = this.getRegistrations();
    const hasRegistrations = registrations.some((r) => r.forum_id === forumId && r.status !== 'cancelled');

    if (hasRegistrations) {
      return {
        success: false,
        error: 'Cannot delete Forum because active student registrations exist. Close registrations or cancel records first.',
      };
    }

    const forums = this.getForums().filter((f) => f.id !== forumId);
    saveToStorage(KEY_FORUMS, forums);
    this.notify();
    return { success: true };
  }

  // ==========================================
  // DOB ELIGIBILITY RULES MANAGEMENT
  // ==========================================

  public getDobRules(): DobEligibilityRule[] {
    return loadFromStorage<DobEligibilityRule[]>(KEY_DOB_RULES, INITIAL_DOB_RULES);
  }

  public getRuleForForum(forumId?: string | null): DobEligibilityRule | undefined {
    const rules = this.getDobRules();
    // 1. Forum-specific rule first
    if (forumId) {
      const specific = rules.find((r) => r.forum_id === forumId);
      if (specific) return specific;
    }
    // 2. Fallback to global rule (forum_id === null)
    return rules.find((r) => r.forum_id === null);
  }

  public saveDobRule(rule: Partial<DobEligibilityRule>): DobEligibilityRule {
    const rules = this.getDobRules();
    const id = rule.id || `rule-${Date.now()}`;
    const existingIndex = rules.findIndex((r) => r.id === id || (rule.forum_id !== undefined && r.forum_id === rule.forum_id));

    const fullRule: DobEligibilityRule = {
      id,
      forum_id: rule.forum_id || null,
      min_dob: rule.min_dob || undefined,
      max_dob: rule.max_dob || undefined,
      blocked_dobs: rule.blocked_dobs || [],
      blocked_ranges: rule.blocked_ranges || [],
      is_enabled: rule.is_enabled !== undefined ? rule.is_enabled : true,
      description: rule.description || 'Configured DOB Eligibility Rule',
      created_at: rule.created_at || new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      rules[existingIndex] = fullRule;
    } else {
      rules.push(fullRule);
    }

    saveToStorage(KEY_DOB_RULES, rules);
    this.notify();
    return fullRule;
  }

  public deleteDobRule(id: string): void {
    const rules = this.getDobRules().filter((r) => r.id !== id);
    saveToStorage(KEY_DOB_RULES, rules);
    this.notify();
  }

  // ==========================================
  // FORUM INVITATION TEMPLATES
  // ==========================================

  public getTemplates(): ForumInvitationTemplate[] {
    return loadFromStorage<ForumInvitationTemplate[]>(KEY_TEMPLATES, INITIAL_PDF_TEMPLATES);
  }

  public getTemplateForForum(forumId: string): ForumInvitationTemplate {
    const templates = this.getTemplates();
    const found = templates.find((t) => t.forum_id === forumId);
    if (found) return found;

    // Generate fallback template for this forum
    const forum = this.getForumById(forumId);
    return {
      id: `tpl-${forumId}`,
      forum_id: forumId,
      forum_name: forum?.name || 'National Forum',
      organizer_logo_text: 'REGISTER TO EVENT (RTE)',
      accent_color: '#1E1B4B',
      formal_salutation: 'Distinguished Participant,',
      invitation_text: `We have the distinct honor of formally welcoming you to the ${forum?.name || 'Forum'} at the 2026 Summit in Jamshedpur. Your delegate accreditation is officially confirmed.`,
      special_instructions: 'Please bring this official PDF invitation and your institutional ID card.',
      terms_and_conditions: [
        '1. Strictly non-transferable and issued solely to the named participant.',
        '2. Report to Jamshedpur Summit Center 45 minutes prior to session commencement.',
        '3. Abide by the RTE Code of Academic & Professional Conduct.',
      ],
      contact_phone: '+91 657 243 1900',
      contact_email: 'invitations@registertoevent.org',
      signatory_name: 'Dr. S. Mukherjee',
      signatory_designation: 'Secretary General, RTE National Committee',
    };
  }

  private ensureTemplateForForum(forum: Forum): void {
    const templates = this.getTemplates();
    if (!templates.some((t) => t.forum_id === forum.id)) {
      const newTpl: ForumInvitationTemplate = {
        id: `tpl-${forum.id}`,
        forum_id: forum.id,
        forum_name: forum.name,
        organizer_logo_text: `REGISTER TO EVENT (RTE) — ${forum.category.toUpperCase()}`,
        accent_color: '#1E1B4B',
        formal_salutation: 'Distinguished Delegate,',
        invitation_text: `The Organizing Committee formally confirms your official accreditation for ${forum.name} at the National Summit in Jamshedpur.`,
        special_instructions: 'Please present this printed document at the accreditation verification desk.',
        terms_and_conditions: [
          '1. Strictly non-transferable and valid solely for the named delegate.',
          '2. Institutional identification is mandatory for physical clearance.',
          '3. Compliance with the RTE Code of Conduct is mandatory.',
        ],
        contact_phone: '+91 657 243 1900',
        contact_email: 'secretariat@registertoevent.org',
        signatory_name: 'Dr. S. Mukherjee',
        signatory_designation: 'Secretary General, RTE National Committee',
      };
      templates.push(newTpl);
      saveToStorage(KEY_TEMPLATES, templates);
    }
  }

  public saveTemplate(template: ForumInvitationTemplate): void {
    const templates = this.getTemplates();
    const idx = templates.findIndex((t) => t.id === template.id || t.forum_id === template.forum_id);
    if (idx >= 0) {
      templates[idx] = template;
    } else {
      templates.push(template);
    }
    saveToStorage(KEY_TEMPLATES, templates);
    this.notify();
  }

  // ==========================================
  // REGISTRATIONS MANAGEMENT
  // ==========================================

  public getRegistrations(): Registration[] {
    return loadFromStorage<Registration[]>(KEY_REGISTRATIONS, INITIAL_DEMO_REGISTRATIONS);
  }

  public getUserRegistrations(userId: string): Registration[] {
    return this.getRegistrations().filter((r) => r.user_id === userId);
  }

  /**
   * CRITICAL FUNCTION: Register participant for forum
   * Strictly enforces:
   * 1. 12-digit PID validation
   * 2. Identity masking (School ID or last 4 digits of Aadhaar - full Aadhaar never stored)
   * 3. DOB Eligibility verification on the service side (returns exact required message if rejected)
   * 4. Does NOT save rejected registrations!
   * 5. Duplicate registration check (same forum + participant)
   * 6. Forum registration window check (Open/Closed)
   * 7. Unique registration ID generation: JSR-2026-XXXXX
   */
  public async submitRegistration(input: {
    forum_id: string;
    full_name: string;
    class_grade: string;
    contact_number: string;
    email: string;
    date_of_birth: string;
    participant_id_number: string;
    masked_id_type: 'school_id' | 'masked_aadhaar';
    id_proof_value: string;
    payment_reference?: string;
  }): Promise<{ success: boolean; registration?: Registration; error?: string }> {
    const forum = this.getForumById(input.forum_id);
    if (!forum) {
      return { success: false, error: 'Selected Forum could not be found.' };
    }

    if (forum.status === 'closed') {
      return {
        success: false,
        error: `Registrations for ${forum.name} are currently closed.`,
      };
    }

    const cleanPid = input.participant_id_number.replace(/\s+/g, '');
    if (!/^\d{12}$/.test(cleanPid)) {
      return {
        success: false,
        error: 'Participant Identification Number must be exactly 12 numeric digits.',
      };
    }

    // 1. BACKEND DOB ELIGIBILITY CHECK
    const rule = this.getRuleForForum(forum.id);
    const dobCheck = validateDobEligibility(input.date_of_birth, rule);
    if (!dobCheck.isEligible) {
      // MANDATORY REQUIREMENT: DO NOT SAVE REJECTED REGISTRATIONS!
      return {
        success: false,
        error: dobCheck.message,
      };
    }

    // 2. DUPLICATE REGISTRATION CHECK
    const existing = this.getRegistrations();
    const dupCheck = checkDuplicateRegistration(existing, forum.id, cleanPid, input.email);
    if (dupCheck.isDuplicate) {
      return {
        success: false,
        error: dupCheck.reason || 'You are already registered for this Forum.',
      };
    }

    // 3. GENERATE UNIQUE REGISTRATION ID
    let regNumber = generateRegistrationId();
    while (existing.some((r) => r.registration_number === regNumber)) {
      regNumber = generateRegistrationId();
    }

    const maskedValue = maskIdentity(input.masked_id_type, input.id_proof_value);

    const currentUser = this.getCurrentUser();
    const userId = currentUser ? currentUser.id : `usr-guest-${Date.now()}`;

    const isPaid = forum.is_paid && forum.registration_fee > 0;
    const initialStatus = isPaid ? 'pending_payment' : 'confirmed';
    const initialPaymentStatus = isPaid ? 'pending_verification' : 'free';

    const verifyUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://registertoevent.org'}/verify?regId=${regNumber}`;

    const newRegistration: Registration = {
      id: `reg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      registration_number: regNumber,
      forum_id: forum.id,
      forum_name: forum.name,
      user_id: userId,
      full_name: input.full_name.trim(),
      class_grade: input.class_grade.trim(),
      contact_number: input.contact_number.trim(),
      email: input.email.trim().toLowerCase(),
      date_of_birth: input.date_of_birth.trim(),
      participant_id_number: cleanPid,
      masked_id_type: input.masked_id_type,
      masked_id_value: maskedValue,
      status: initialStatus,
      payment_status: initialPaymentStatus,
      payment_reference: input.payment_reference?.trim() || undefined,
      qr_verification_url: verifyUrl,
      created_at: new Date().toISOString(),
      verified_at: isPaid ? undefined : new Date().toISOString(),
    };

    // Save to persistent storage
    existing.unshift(newRegistration);
    saveToStorage(KEY_REGISTRATIONS, existing);

    // If paid, create payment record
    if (isPaid) {
      const payments = this.getPayments();
      const paymentRecord: PaymentRecord = {
        id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        registration_id: newRegistration.id,
        registration_number: newRegistration.registration_number,
        user_id: userId,
        user_name: newRegistration.full_name,
        user_email: newRegistration.email,
        forum_id: forum.id,
        forum_name: forum.name,
        amount: forum.registration_fee,
        transaction_ref: input.payment_reference?.trim() || 'Awaiting Submission',
        status: 'pending_verification',
        created_at: new Date().toISOString(),
      };
      payments.unshift(paymentRecord);
      saveToStorage(KEY_PAYMENTS, payments);
    }

    // Update Forum registered count
    const forums = this.getForums();
    const forumIdx = forums.findIndex((f) => f.id === forum.id);
    if (forumIdx >= 0) {
      forums[forumIdx].registered_count = (forums[forumIdx].registered_count || 0) + 1;
      saveToStorage(KEY_FORUMS, forums);
    }

    // In-app notification
    this.addNotification({
      user_id: userId,
      title: 'Registration Confirmed!',
      message: `You are successfully registered for ${forum.name}. Registration ID: ${newRegistration.registration_number}`,
      type: 'success',
    });

    this.notify();
    return { success: true, registration: newRegistration };
  }

  // ==========================================
  // PAYMENT MANAGEMENT
  // ==========================================

  public getPayments(): PaymentRecord[] {
    return loadFromStorage<PaymentRecord[]>(KEY_PAYMENTS, INITIAL_DEMO_PAYMENTS);
  }

  public submitPaymentReference(registrationId: string, transactionRef: string, notes?: string): { success: boolean; error?: string } {
    const registrations = this.getRegistrations();
    const reg = registrations.find((r) => r.id === registrationId);
    if (!reg) return { success: false, error: 'Registration not found' };

    reg.payment_reference = transactionRef.trim();
    reg.payment_notes = notes;
    reg.payment_status = 'pending_verification';
    saveToStorage(KEY_REGISTRATIONS, registrations);

    const payments = this.getPayments();
    const pIdx = payments.findIndex((p) => p.registration_id === registrationId);
    if (pIdx >= 0) {
      payments[pIdx].transaction_ref = transactionRef.trim();
      payments[pIdx].status = 'pending_verification';
      payments[pIdx].notes = notes;
    } else {
      const forum = this.getForumById(reg.forum_id);
      payments.unshift({
        id: `pay-${Date.now()}`,
        registration_id: reg.id,
        registration_number: reg.registration_number,
        user_id: reg.user_id,
        user_name: reg.full_name,
        user_email: reg.email,
        forum_id: reg.forum_id,
        forum_name: reg.forum_name,
        amount: forum?.registration_fee || 0,
        transaction_ref: transactionRef.trim(),
        status: 'pending_verification',
        notes,
        created_at: new Date().toISOString(),
      });
    }
    saveToStorage(KEY_PAYMENTS, payments);

    this.addNotification({
      user_id: reg.user_id,
      title: 'Payment Reference Submitted',
      message: `Your payment reference (${transactionRef}) for ${reg.forum_name} was received and is pending admin verification.`,
      type: 'info',
    });

    this.notify();
    return { success: true };
  }

  /**
   * MANUAL PAYMENT VERIFICATION BY ADMIN
   * Requirement: "Mark a payment as verified only after genuine verification. Never automatically mark a payment as paid."
   */
  public verifyPayment(paymentId: string, status: 'verified' | 'rejected', notes?: string): { success: boolean } {
    const currentUser = this.getCurrentUser();
    const payments = this.getPayments();
    const p = payments.find((x) => x.id === paymentId);
    if (!p) return { success: false };

    p.status = status;
    p.notes = notes || p.notes;
    p.verified_by = currentUser?.email || 'admin@registertoevent.org';
    p.verified_at = new Date().toISOString();
    saveToStorage(KEY_PAYMENTS, payments);

    // Sync with registration
    const registrations = this.getRegistrations();
    const reg = registrations.find((r) => r.id === p.registration_id);
    if (reg) {
      reg.payment_status = status;
      if (status === 'verified') {
        reg.status = 'verified';
        reg.verified_at = new Date().toISOString();
      }
      saveToStorage(KEY_REGISTRATIONS, registrations);

      this.addNotification({
        user_id: reg.user_id,
        title: status === 'verified' ? 'Payment Verified!' : 'Payment Issue Flagged',
        message:
          status === 'verified'
            ? `Your payment for ${reg.forum_name} (Reg ID: ${reg.registration_number}) has been verified. You can now download your official Invitation PDF.`
            : `Your payment reference for ${reg.forum_name} was marked as ${status}. Note: ${notes || 'Please resubmit valid UTR.'}`,
        type: status === 'verified' ? 'success' : 'warning',
      });
    }

    this.notify();
    return { success: true };
  }

  // ==========================================
  // ANNOUNCEMENTS MANAGEMENT
  // ==========================================

  public getAnnouncements(): Announcement[] {
    return loadFromStorage<Announcement[]>(KEY_ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  }

  public saveAnnouncement(ann: Partial<Announcement> & { title: string; content: string }): Announcement {
    const list = this.getAnnouncements();
    const id = ann.id || `ann-${Date.now()}`;
    const idx = list.findIndex((a) => a.id === id);

    const record: Announcement = {
      id,
      title: ann.title,
      content: ann.content,
      priority: ann.priority || 'normal',
      target_forum_id: ann.target_forum_id || null,
      is_published: ann.is_published !== undefined ? ann.is_published : true,
      published_at: ann.published_at || new Date().toISOString(),
      created_at: ann.created_at || new Date().toISOString(),
    };

    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }

    saveToStorage(KEY_ANNOUNCEMENTS, list);
    this.notify();
    return record;
  }

  public deleteAnnouncement(id: string): void {
    const list = this.getAnnouncements().filter((a) => a.id !== id);
    saveToStorage(KEY_ANNOUNCEMENTS, list);
    this.notify();
  }

  // ==========================================
  // IN-APP NOTIFICATIONS
  // ==========================================

  public getNotifications(userId?: string): InAppNotification[] {
    const all = loadFromStorage<InAppNotification[]>(KEY_NOTIFICATIONS, [
      {
        id: 'notif-1',
        title: 'RTE National Summit 2026',
        message: 'Welcome to REGISTER TO EVENT. Explore open forums and register early.',
        type: 'info',
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ]);
    if (!userId) return all;
    return all.filter((n) => !n.user_id || n.user_id === userId);
  }

  public addNotification(notif: Omit<InAppNotification, 'id' | 'is_read' | 'created_at'>): void {
    const all = this.getNotifications();
    all.unshift({
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      is_read: false,
      created_at: new Date().toISOString(),
    });
    saveToStorage(KEY_NOTIFICATIONS, all.slice(0, 50));
    this.notify();
  }

  public markNotificationsRead(userId?: string): void {
    const all = this.getNotifications();
    all.forEach((n) => {
      if (!userId || !n.user_id || n.user_id === userId) {
        n.is_read = true;
      }
    });
    saveToStorage(KEY_NOTIFICATIONS, all);
    this.notify();
  }

  // ==========================================
  // EXPORT TOOLS (CSV & JSON)
  // ==========================================

  public exportParticipantsCsv(forumId?: string): string {
    const registrations = this.getRegistrations().filter((r) => !forumId || r.forum_id === forumId);
    const headers = [
      'Registration ID',
      'Forum Name',
      'Full Name',
      'Class/Grade',
      'Contact',
      'Email',
      'DOB',
      'PID',
      'ID Type',
      'Masked ID',
      'Status',
      'Payment Status',
      'Payment Ref',
      'Registered At',
    ];

    const rows = registrations.map((r) => [
      `"${r.registration_number}"`,
      `"${r.forum_name.replace(/"/g, '""')}"`,
      `"${r.full_name.replace(/"/g, '""')}"`,
      `"${r.class_grade}"`,
      `"${r.contact_number}"`,
      `"${r.email}"`,
      `"${r.date_of_birth}"`,
      `"${r.participant_id_number}"`,
      `"${r.masked_id_type}"`,
      `"${r.masked_id_value}"`,
      `"${r.status}"`,
      `"${r.payment_status}"`,
      `"${r.payment_reference || ''}"`,
      `"${r.created_at}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public exportPaymentsCsv(): string {
    const payments = this.getPayments();
    const headers = [
      'Payment ID',
      'Registration ID',
      'Delegate Name',
      'Email',
      'Forum',
      'Amount (INR)',
      'UTR/Transaction Ref',
      'Status',
      'Verified By',
      'Verified At',
      'Date',
    ];

    const rows = payments.map((p) => [
      `"${p.id}"`,
      `"${p.registration_number}"`,
      `"${p.user_name.replace(/"/g, '""')}"`,
      `"${p.user_email}"`,
      `"${p.forum_name.replace(/"/g, '""')}"`,
      p.amount,
      `"${p.transaction_ref}"`,
      `"${p.status}"`,
      `"${p.verified_by || ''}"`,
      `"${p.verified_at || ''}"`,
      `"${p.created_at}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export const dataService = new DataService();
