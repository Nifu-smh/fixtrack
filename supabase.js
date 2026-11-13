import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://mrrcwwyqoscsityitzir.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ycmN3d3lxb3Njc2l0eWl0emlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ1NDY3MjMsImV4cCI6MjExMDEyMjcyM30.5fJwm1GCxMUBGqyCTeq5oSaboFXxHFUaODHfTkgD1ag';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Helper to convert DB snake_case to app camelCase
export function mapCaseFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    issueType: row.issue_type,
    asset: row.asset_id || '',
    location: row.location_id || '',
    priority: row.priority || 'medium',
    status: row.status || 'new',
    assignedTo: row.assigned_to,
    repairNote: row.repair_note || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at
  };
}

export function mapReportFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    issueType: row.issue_type,
    asset: row.asset_id || '',
    location: row.location_id || '',
    reporter: row.reporter_id || 'student',
    reporterName: row.reporter_name || 'Campus member',
    reporterEmail: row.reporter_email || '',
    caseId: row.case_id || null,
    triaged: !!row.triaged,
    safety: !!row.safety,
    photo: row.photo_url || null,
    createdAt: row.created_at
  };
}

export function mapUpdateFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    caseId: row.case_id,
    actor: row.actor_name || 'System',
    actorId: row.actor_id,
    action: row.action,
    note: row.note,
    createdAt: row.created_at
  };
}

export function mapTechFromProfile(p) {
  return {
    id: p.id,
    name: p.name,
    initials: p.initials || p.name?.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() || 'TC',
    skill: p.skill || 'Computer / IT',
    color: p.color || 'blue',
    email: p.email,
    available: p.available !== false,
    phone: p.phone || ''
  };
}

// Authentication API
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;
  return session;
}

export async function getCurrentUserProfile() {
  const session = await getSession();
  if (!session?.user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();
  if (error || !data) {
    // Return fallback from user metadata
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.name || session.user.email.split('@')[0],
      role: session.user.user_metadata?.role || 'reporter',
      department: 'Campus Member',
      phone: ''
    };
  }
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email, password, { name, role = 'reporter', department = '' } = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role, department }
    }
  });
  if (error) throw error;
  if (data?.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email,
      name: name || email.split('@')[0],
      role,
      department
    });
  }
  return data;
}

export async function signInWithGoogle() {
  const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Backend Data APIs
export async function fetchAllData() {
  const [
    { data: locationsData },
    { data: assetsData },
    { data: profilesData },
    { data: casesData },
    { data: reportsData },
    { data: updatesData },
    { data: settingsData }
  ] = await Promise.all([
    supabase.from('locations').select('*').order('id'),
    supabase.from('assets').select('*').order('id'),
    supabase.from('profiles').select('*'),
    supabase.from('maintenance_cases').select('*').order('created_at', { ascending: false }),
    supabase.from('issue_reports').select('*').order('created_at', { ascending: false }),
    supabase.from('case_updates').select('*').order('created_at', { ascending: false }),
    supabase.from('campus_settings').select('*').eq('id', 1).maybeSingle()
  ]);

  const cases = (casesData || []).map(mapCaseFromDb);
  const reports = (reportsData || []).map(mapReportFromDb);
  const updates = (updatesData || []).map(mapUpdateFromDb);
  const technicians = (profilesData || [])
    .filter(p => p.role === 'technician')
    .map(mapTechFromProfile);

  const locations = (locationsData || []).map(l => ({
    id: l.id,
    building: l.building,
    room: l.room,
    floor: l.floor
  }));

  const assets = (assetsData || []).map(a => ({
    id: a.id,
    name: a.name,
    category: a.category,
    location: a.location_id,
    health: a.health ?? 100
  }));

  const settings = settingsData ? {
    campus: settingsData.campus,
    emergency: settingsData.emergency,
    sla: settingsData.sla,
    emailNotifications: settingsData.email_notifications,
    inAppNotifications: settingsData.in_app_notifications
  } : {
    campus: 'Darul Uloom Campus',
    emergency: 'Contact the campus office or the nearest responsible staff member immediately.',
    sla: 24,
    emailNotifications: true,
    inAppNotifications: true
  };

  return {
    cases,
    reports,
    updates,
    technicians,
    assets,
    locations,
    settings,
    profiles: profilesData || []
  };
}

// Create new report
export async function createReport(reportData, userProfile) {
  // Generate next RPT ID
  const { data: existing } = await supabase.from('issue_reports').select('id');
  const maxNum = (existing || []).reduce((max, r) => {
    const num = parseInt(r.id.replace(/\D/g, ''), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  const newId = `RPT-${String(maxNum + 1).padStart(3, '0')}`;

  const row = {
    id: newId,
    title: reportData.title,
    description: reportData.description,
    category: reportData.category,
    issue_type: reportData.issueType,
    asset_id: reportData.asset || null,
    location_id: reportData.location,
    reporter_id: userProfile?.id || null,
    reporter_name: userProfile?.name || 'Campus member',
    reporter_email: userProfile?.email || '',
    case_id: null,
    triaged: false,
    safety: !!reportData.safety,
    photo_url: reportData.photo || null,
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('issue_reports').insert(row).select().single();
  if (error) throw error;
  return mapReportFromDb(data);
}

// Create new maintenance case from report
export async function createCaseFromReport(reportId, initialPriority = 'medium', userProfile) {
  const { data: report, error: repErr } = await supabase
    .from('issue_reports')
    .select('*')
    .eq('id', reportId)
    .single();
  if (repErr || !report) throw new Error('Report not found');

  const { data: existingCases } = await supabase.from('maintenance_cases').select('id');
  const maxNum = (existingCases || []).reduce((max, c) => {
    const num = parseInt(c.id.replace(/\D/g, ''), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  const newCaseId = `FIX-${String(maxNum + 1).padStart(3, '0')}`;

  const now = new Date().toISOString();
  const caseRow = {
    id: newCaseId,
    title: report.title,
    description: report.description,
    category: report.category,
    issue_type: report.issue_type,
    asset_id: report.asset_id,
    location_id: report.location_id,
    priority: initialPriority,
    status: 'triaged',
    assigned_to: null,
    repair_note: '',
    created_at: now,
    updated_at: now
  };

  const { error: caseErr } = await supabase.from('maintenance_cases').insert(caseRow);
  if (caseErr) throw caseErr;

  // Link report to case
  await supabase
    .from('issue_reports')
    .update({ case_id: newCaseId, triaged: true })
    .eq('id', reportId);

  // Add case update
  await supabase.from('case_updates').insert({
    case_id: newCaseId,
    actor_id: userProfile?.id || null,
    actor_name: userProfile?.name || 'Maintenance admin',
    action: 'Maintenance case created',
    note: `Created from ${reportId}. Ready for technician assignment.`,
    created_at: now
  });

  return newCaseId;
}

// Link duplicate report to existing case
export async function linkReportToCase(reportId, caseId, userProfile) {
  const now = new Date().toISOString();
  const { error: linkErr } = await supabase
    .from('issue_reports')
    .update({ case_id: caseId, triaged: true })
    .eq('id', reportId);
  if (linkErr) throw linkErr;

  await supabase.from('case_updates').insert({
    case_id: caseId,
    actor_id: userProfile?.id || null,
    actor_name: userProfile?.name || 'Maintenance admin',
    action: 'Duplicate report linked',
    note: `Report ${reportId} was reviewed and linked to this maintenance case.`,
    created_at: now
  });
}

// Update case status / assignment
export async function updateCase(caseId, fields, action, note, userProfile) {
  const now = new Date().toISOString();
  const dbFields = { updated_at: now };

  if (fields.status) dbFields.status = fields.status;
  if (fields.assignedTo !== undefined) dbFields.assigned_to = fields.assignedTo || null;
  if (fields.priority) dbFields.priority = fields.priority;
  if (fields.repairNote !== undefined) dbFields.repair_note = fields.repairNote;

  const { error } = await supabase
    .from('maintenance_cases')
    .update(dbFields)
    .eq('id', caseId);
  if (error) throw error;

  if (action && note) {
    await supabase.from('case_updates').insert({
      case_id: caseId,
      actor_id: userProfile?.id || null,
      actor_name: userProfile?.name || 'Maintenance admin',
      action,
      note,
      created_at: now
    });
  }
}

// Toggle technician availability
export async function setTechAvailability(techId, available) {
  const { error } = await supabase
    .from('profiles')
    .update({ available })
    .eq('id', techId);
  if (error) throw error;
}

// Update profile
export async function updateUserProfile(userId, { name, department, phone }) {
  const { error } = await supabase
    .from('profiles')
    .update({ name, department, phone, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

// Update settings
export async function updateCampusSettings({ campus, emergency, sla, inAppNotifications }) {
  const { error } = await supabase
    .from('campus_settings')
    .update({
      campus,
      emergency,
      sla: Number(sla),
      in_app_notifications: inAppNotifications,
      updated_at: new Date().toISOString()
    })
    .eq('id', 1);
  if (error) throw error;
}

// Add new technician
export async function addTechnician({ name, email, skill }) {
  // Check if profile exists
  const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
  if (existing) throw new Error('A technician with that email already exists.');

  const initials = name.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
  const id = crypto.randomUUID();
  const { error } = await supabase.from('profiles').insert({
    id,
    name,
    email,
    role: 'technician',
    skill,
    department: skill + ' Maintenance',
    available: true,
    initials,
    color: 'purple'
  });
  if (error) throw error;
}

// Add new asset
export async function addAsset({ id, name, category, location }) {
  const { error } = await supabase.from('assets').insert({
    id: id.trim().toUpperCase(),
    name: name.trim(),
    category,
    location_id: location,
    health: 100
  });
  if (error) throw error;
}
