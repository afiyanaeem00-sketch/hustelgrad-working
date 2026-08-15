// ─────────────────────────────────────────────────────────────────────────────
// API client for the HustleGrad backend (FastAPI).
//
// In Docker, nginx proxies `/api/*` straight to the `backend` service, and in
// local `vite dev` the dev server proxies `/api/*` to http://localhost:8000 —
// see nginx.conf / vite.config.ts. So this file always calls a relative
// `/api/...` path and never needs to know the backend's real host/port.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = '/api'
const TOKEN_KEY = 'hustlegrad_token'
const USER_KEY = 'hustlegrad_user'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}
export function getStoredUser(): any | null {
  const raw = localStorage.getItem(USER_KEY)
  try { return raw ? JSON.parse(raw) : null } catch { return null }
}
function setStoredUser(user: any | null) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_KEY)
}
export function clearSession() {
  setToken(null)
  setStoredUser(null)
}

function qs(params?: Record<string, string | number | undefined | null>): string {
  if (!params) return ''
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  if (!entries.length) return ''
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    let detail = res.statusText || `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.detail) detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    } catch {
      // response wasn't JSON — keep the default message
    }
    throw new ApiError(detail, res.status)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ─────────────────────────────────────────────────────────────────────────────
// Small formatting helpers shared by the adapters below
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmtDate(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getDate().toString().padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function fmtLpa(value?: number | null): string {
  if (value === undefined || value === null) return '—'
  return `₹${Number(value).toFixed(1)} LPA`
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

export interface LoginPayload { email: string; password: string; role: string }
export interface SignupPayload { full_name: string; email: string; password: string; institution: string; role: string }

async function login(payload: LoginPayload) {
  const res = await request<{ access_token: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  setToken(res.access_token)
  setStoredUser(res.user)
  return res
}

async function signup(payload: SignupPayload) {
  const res = await request<{ access_token: string; user: any }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  setToken(res.access_token)
  setStoredUser(res.user)
  return res
}

function logout() {
  clearSession()
}

// ─────────────────────────────────────────────────────────────────────────────
// Adapters: backend (snake_case, DB-shaped) -> frontend view models
// (kept identical to the shapes App.tsx already renders, so page components
// barely change — only the data source does.)
// ─────────────────────────────────────────────────────────────────────────────

function mapStudentListItem(s: any) {
  return {
    id: s.id,
    name: s.name,
    initials: s.initials || s.name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase(),
    avatarColor: s.avatar_color || '#334155',
    avatarBg: s.avatar_bg || '#f1f5f9',
    roll: s.roll,
    department: s.department,
    batch: s.batch,
    semester: s.semester,
    cgpa: s.cgpa,
    status: s.status,
    company: s.company ?? undefined,
    resumeUrl: s.resume_url || '#',
  }
}

function mapStudentDetail(s: any) {
  return {
    ...mapStudentListItem(s),
    email: s.email,
    phone: s.phone || '',
    hometown: s.hometown || '',
    github: s.github || '',
    linkedin: s.linkedin || '',
    portfolio: s.portfolio || '',
    bio: s.bio || '',
    skills: s.skills || [],
    certifications: (s.certifications || []).map((c: any) => ({ name: c.name, issuer: c.issuer, year: c.year })),
    semRecords: (s.semester_records || []).map((r: any) => ({ sem: r.sem, gpa: r.gpa, backlogs: r.backlogs })),
    graduationYear: s.graduation_year,
    totalBacklogs: s.total_backlogs || 0,
    applications: (s.applications || []).map((a: any) => ({
      company: a.company,
      role: a.role,
      date: fmtDate(a.applied_date),
      stage: a.stage,
      package: a.package ?? undefined,
    })),
  }
}

function mapPlacementApp(a: any) {
  return {
    id: a.id,
    student: a.student_name,
    initials: a.initials || a.student_name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase(),
    avatarColor: a.avatar_color || '#334155',
    avatarBg: a.avatar_bg || '#f1f5f9',
    roll: a.roll,
    department: a.department,
    company: a.company,
    role: a.role,
    appliedDate: fmtDate(a.applied_date),
    stage: a.stage,
    package: a.package ?? undefined,
    offerDate: a.offer_date ? fmtDate(a.offer_date) : undefined,
    joiningDate: a.joining_date ? fmtDate(a.joining_date) : undefined,
  }
}

function mapInternship(i: any) {
  return {
    id: i.id,
    student: i.student_name,
    initials: i.initials || i.student_name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase(),
    avatarColor: i.avatar_color || '#334155',
    avatarBg: i.avatar_bg || '#f1f5f9',
    roll: i.roll,
    department: i.department,
    company: i.company,
    role: i.role,
    duration: i.duration || '',
    startDate: fmtDate(i.start_date),
    endDate: fmtDate(i.end_date),
    mentor: i.mentor || '',
    stipend: i.stipend || '',
    ppoEligible: !!i.ppo_eligible,
    ppoConverted: !!i.ppo_converted,
    status: i.status,
  }
}

function mapDrive(d: any) {
  return {
    id: d.id,
    company: d.company_name,
    logo: d.logo || d.company_name.slice(0, 2).toUpperCase(),
    logoColor: d.logo_color || '#334155',
    logoBg: d.logo_bg || '#f1f5f9',
    position: d.position,
    package: d.package || fmtLpa(d.package_lpa),
    type: d.type,
    eligibility: d.eligibility || '',
    skills: d.skills || [],
    registrationDeadline: fmtDate(d.registration_deadline),
    interviewDate: fmtDate(d.interview_date),
    venue: d.venue || '',
    status: d.status,
    applications: d.applications_count || 0,
  }
}

function mapCompany(c: any) {
  return {
    id: c.id,
    name: c.name,
    logo: c.logo || c.name.slice(0, 2).toUpperCase(),
    logoColor: c.logo_color || '#334155',
    logoBg: c.logo_bg || '#f1f5f9',
    industry: c.industry || '',
    location: c.location || '',
    hrName: c.hr_name || '',
    hrEmail: c.hr_email || '',
    hrPhone: c.hr_phone || '',
    pastVisits: c.past_visits || 0,
    studentsHired: c.students_hired || 0,
    avgPackage: c.avg_package_lpa != null ? fmtLpa(c.avg_package_lpa) : '—',
    highestPackage: c.highest_package_lpa != null ? fmtLpa(c.highest_package_lpa) : '—',
    lastVisit: c.last_visit || '',
    jobHistory: (c.job_history || []).map((j: any) => ({ year: j.year, role: j.role, hired: j.hired, pkg: j.package })),
  }
}

function mapMessage(m: any) {
  const d = new Date(m.sent_at)
  const sentAt = Number.isNaN(d.getTime())
    ? m.sent_at
    : `${fmtDate(m.sent_at)}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  return {
    id: m.id,
    channel: m.channel,
    audience: m.audience,
    subject: m.subject,
    sentAt,
    recipients: m.recipients,
    status: m.status,
  }
}

function mapNotification(n: any) {
  const created = new Date(n.created_at)
  const diffMs = Date.now() - created.getTime()
  const hours = Math.floor(diffMs / 3600000)
  let time: string
  if (Number.isNaN(created.getTime())) time = ''
  else if (hours < 1) time = 'Just now'
  else if (hours < 24) time = `${hours}h ago`
  else if (hours < 48) time = 'Yesterday'
  else time = fmtDate(n.created_at)
  return { id: n.id, text: n.text, time, isRead: !!n.is_read }
}

function mapDashboard(d: any) {
  return {
    kpis: d.kpis,
    chart: d.chart,
    drives: (d.upcoming_drives || []).map((drive: any) => ({
      company: drive.company_name,
      role: drive.position,
      date: fmtDate(drive.interview_date),
      status: drive.status,
      logo: drive.logo || drive.company_name.slice(0, 2).toUpperCase(),
      logoColor: drive.logo_color || '#334155',
      logoBg: drive.logo_bg || '#f1f5f9',
    })),
    notifications: (d.notifications || []).map(mapNotification),
  }
}

export interface CreateStudentPayload {
  name: string
  roll: string
  department: string
  batch: string
  email: string
  semester?: number
  cgpa?: number
  status?: string
}

export interface UpdateStudentPayload {
  name?: string
  department?: string
  batch?: string
  semester?: number
  cgpa?: number
  status?: string
  company?: string
  resume_url?: string
  phone?: string
  hometown?: string
  github?: string
  linkedin?: string
  portfolio?: string
  bio?: string
  skills?: string[]
  graduation_year?: number
  total_backlogs?: number
}

async function createStudent(payload: CreateStudentPayload) {
  return request<any>('/students', { method: 'POST', body: JSON.stringify(payload) }).then(mapStudentDetail)
}

async function updateStudent(id: number, payload: UpdateStudentPayload) {
  return request<any>(`/students/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }).then(mapStudentDetail)
}

async function deleteStudent(id: number) {
  return request<void>(`/students/${id}`, { method: 'DELETE' })
}

async function addCertification(studentId: number, payload: { name: string; issuer?: string; year?: number }) {
  return request<any>(`/students/${studentId}/certifications`, { method: 'POST', body: JSON.stringify(payload) })
}

async function addSemesterRecord(studentId: number, payload: { sem: number; gpa: number; backlogs?: number }) {
  return request<any>(`/students/${studentId}/semester-records`, { method: 'POST', body: JSON.stringify(payload) })
}

// ── Companies ────────────────────────────────────────────────────────────────

export interface CreateCompanyPayload {
  name: string
  industry?: string
  location?: string
  hr_name?: string
  hr_email?: string
  hr_phone?: string
  avg_package_lpa?: number
  highest_package_lpa?: number
}

async function createCompany(payload: CreateCompanyPayload) {
  return request<any>('/companies', { method: 'POST', body: JSON.stringify(payload) }).then(mapCompany)
}

async function updateCompany(id: number, payload: Partial<CreateCompanyPayload> & { last_visit?: string; past_visits?: number; students_hired?: number }) {
  return request<any>(`/companies/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }).then(mapCompany)
}

async function deleteCompany(id: number) {
  return request<void>(`/companies/${id}`, { method: 'DELETE' })
}

async function addJobHistory(companyId: number, payload: { year: string; role: string; hired?: number; package?: string }) {
  return request<any>(`/companies/${companyId}/job-history`, { method: 'POST', body: JSON.stringify(payload) })
}

// ── Drives ───────────────────────────────────────────────────────────────────

export interface CreateDrivePayload {
  company_id: number
  position: string
  package?: string
  package_lpa?: number
  type?: string
  eligibility?: string
  skills?: string[]
  registration_deadline?: string
  interview_date?: string
  venue?: string
  status?: string
}

async function createDrive(payload: CreateDrivePayload) {
  return request<any>('/drives', { method: 'POST', body: JSON.stringify(payload) })
}

async function updateDrive(id: number, payload: Partial<CreateDrivePayload> & { applications_count?: number }) {
  return request<any>(`/drives/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

async function deleteDrive(id: number) {
  return request<void>(`/drives/${id}`, { method: 'DELETE' })
}

// ── Applications (Placements) ───────────────────────────────────────────────

export interface CreateApplicationPayload {
  student_id: number
  company: string
  role: string
  applied_date?: string
  stage?: string
  package?: string
  offer_date?: string
  joining_date?: string
  drive_id?: number
}

export interface UpdateApplicationPayload {
  stage?: string
  package?: string
  offer_date?: string
  joining_date?: string
}

async function createApplication(payload: CreateApplicationPayload) {
  return request<any>('/placements', { method: 'POST', body: JSON.stringify(payload) })
}

async function updateApplication(id: number, payload: UpdateApplicationPayload) {
  return request<any>(`/placements/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

async function deleteApplication(id: number) {
  return request<void>(`/placements/${id}`, { method: 'DELETE' })
}

// ── Internships ──────────────────────────────────────────────────────────────

export interface CreateInternshipPayload {
  student_id: number
  company: string
  role: string
  duration?: string
  start_date?: string
  end_date?: string
  mentor?: string
  stipend?: string
  ppo_eligible?: boolean
  ppo_converted?: boolean
  status?: string
}

export interface UpdateInternshipPayload {
  status?: string
  ppo_eligible?: boolean
  ppo_converted?: boolean
  end_date?: string
}

async function createInternship(payload: CreateInternshipPayload) {
  return request<any>('/internships', { method: 'POST', body: JSON.stringify(payload) })
}

async function updateInternship(id: number, payload: UpdateInternshipPayload) {
  return request<any>(`/internships/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

async function deleteInternship(id: number) {
  return request<void>(`/internships/${id}`, { method: 'DELETE' })
}

// ── Notifications ────────────────────────────────────────────────────────────

async function markNotificationRead(id: number) {
  return request<any>(`/communication/notifications/${id}/read`, { method: 'PATCH' })
}

// ── Users (admin) ────────────────────────────────────────────────────────────

function mapUser(u: any) {
  return {
    id: u.id,
    fullName: u.full_name,
    email: u.email,
    role: u.role,
    institution: u.institution || '',
    isActive: !!u.is_active,
  }
}

async function listUsers() {
  return request<any[]>('/users').then(list => list.map(mapUser))
}

async function updateUser(id: number, payload: { role?: string; is_active?: boolean }) {
  return request<any>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }).then(mapUser)
}

async function deleteUser(id: number) {
  return request<void>(`/users/${id}`, { method: 'DELETE' })
}

export const api = {
  isAuthenticated: () => !!getToken(),
  getStoredUser,
  logout,

  auth: { login, signup },

  dashboard: {
    get: () => request<any>('/dashboard').then(mapDashboard),
  },

  students: {
    list: (params?: { department?: string; batch?: string; status?: string; search?: string }) =>
      request<any[]>(`/students${qs(params)}`).then(list => list.map(mapStudentListItem)),
    get: (id: number) => request<any>(`/students/${id}`).then(mapStudentDetail),
    create: (payload: CreateStudentPayload) => createStudent(payload),
    update: (id: number, payload: UpdateStudentPayload) => updateStudent(id, payload),
    delete: (id: number) => deleteStudent(id),
    addCertification: (studentId: number, payload: { name: string; issuer?: string; year?: number }) => addCertification(studentId, payload),
    addSemesterRecord: (studentId: number, payload: { sem: number; gpa: number; backlogs?: number }) => addSemesterRecord(studentId, payload),
  },

  placements: {
    list: (params?: { stage?: string; department?: string; company?: string }) =>
      request<any[]>(`/placements${qs(params)}`).then(list => list.map(mapPlacementApp)),
    create: (payload: CreateApplicationPayload) => createApplication(payload),
    update: (id: number, payload: UpdateApplicationPayload) => updateApplication(id, payload),
    delete: (id: number) => deleteApplication(id),
  },

  internships: {
    list: (params?: { status?: string; department?: string }) =>
      request<any[]>(`/internships${qs(params)}`).then(list => list.map(mapInternship)),
    create: (payload: CreateInternshipPayload) => createInternship(payload),
    update: (id: number, payload: UpdateInternshipPayload) => updateInternship(id, payload),
    delete: (id: number) => deleteInternship(id),
  },

  drives: {
    list: (params?: { status?: string }) =>
      request<any[]>(`/drives${qs(params)}`).then(list => list.map(mapDrive)),
    create: (payload: CreateDrivePayload) => createDrive(payload),
    update: (id: number, payload: Partial<CreateDrivePayload> & { applications_count?: number }) => updateDrive(id, payload),
    delete: (id: number) => deleteDrive(id),
  },

  companies: {
    list: () => request<any[]>('/companies').then(list => list.map(mapCompany)),
    get: (id: number) => request<any>(`/companies/${id}`).then(mapCompany),
    create: (payload: CreateCompanyPayload) => createCompany(payload),
    update: (id: number, payload: Partial<CreateCompanyPayload> & { last_visit?: string; past_visits?: number; students_hired?: number }) => updateCompany(id, payload),
    delete: (id: number) => deleteCompany(id),
    addJobHistory: (companyId: number, payload: { year: string; role: string; hired?: number; package?: string }) => addJobHistory(companyId, payload),
  },

  communication: {
    messages: () => request<any[]>('/communication/messages').then(list => list.map(mapMessage)),
    send: (payload: { channel: string; audience: string; subject: string; body?: string; recipients: number; status?: string }) =>
      request<any>('/communication/messages', { method: 'POST', body: JSON.stringify(payload) }).then(mapMessage),
    notifications: () => request<any[]>('/communication/notifications').then(list => list.map(mapNotification)),
    markNotificationRead: (id: number) => markNotificationRead(id),
  },

  users: {
    list: () => listUsers(),
    update: (id: number, payload: { role?: string; is_active?: boolean }) => updateUser(id, payload),
    delete: (id: number) => deleteUser(id),
  },
}
