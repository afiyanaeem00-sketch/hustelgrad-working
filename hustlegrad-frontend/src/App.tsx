import React, { useState, useMemo, useEffect, createContext, useContext } from 'react'
import {
  LayoutDashboard, Users, Briefcase, Award, Building2,
  CalendarDays, MessageSquare, BarChart2, FileText,
  ClipboardList, Settings, Bell, Search, ChevronDown,
  TrendingUp, TrendingDown, ArrowRight, Menu, X,
  Plus, ExternalLink, Filter, ChevronUp, ChevronsUpDown,
  Eye, EyeOff, Sun, Moon, ShieldCheck
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import hustleGradLogo from '@/imports/Screenshot_2026-08-01_153948-removebg-preview.png'
import { api } from '@/lib/api'

const theme = (dark: boolean) => ({
  bg: dark ? '#0f172a' : '#ffffff',
  bgAlt: dark ? '#1e293b' : '#f1f5f9',
  text: dark ? '#e2e8f0' : '#334155',
  textMuted: dark ? '#94a3b8' : '#64748b',
  border: dark ? '#334155' : '#e2e8f0',
  accent: dark ? '#818cf8' : '#3b5bdb',
})

const ThemeContext = createContext(theme(false))
const useTheme = () => useContext(ThemeContext)
// ─────────────────────────────────────────────────────────────────────────────
// Shared constants
// ─────────────────────────────────────────────────────────────────────────────

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Users, label: 'Students' },
  { icon: Briefcase, label: 'Internships' },
  { icon: Award, label: 'Placements' },
  { icon: Building2, label: 'Companies' },
  { icon: CalendarDays, label: 'Drives' },
  { icon: MessageSquare, label: 'Communication' },
  { icon: BarChart2, label: 'Analytics' },
  { icon: FileText, label: 'Documents' },
  { icon: ClipboardList, label: 'Reports' },
]

const NOTIFICATIONS = [
  { text: 'Amazon India accepted drive invitation', time: '2h ago' },
  { text: 'Priya Sharma updated her profile', time: '4h ago' },
  { text: 'Drive report for Infosys ready', time: 'Yesterday' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard data
// ─────────────────────────────────────────────────────────────────────────────

const KPI = [
  { label: 'Placement Rate', value: '84.3%', delta: '+6.2%', up: true, sub: 'vs last academic year', color: '#3b5bdb', bg: '#eef0ff' },
  { label: 'Avg. Package', value: '₹8.4 LPA', delta: '+₹0.7 LPA', up: true, sub: 'median CTC offered', color: '#0ea5e9', bg: '#e0f2fe' },
  { label: 'Students Placed', value: '1,247', delta: '+183', up: true, sub: 'out of 1,479 eligible', color: '#10b981', bg: '#d1fae5' },
  { label: 'Companies Visited', value: '94', delta: '-3', up: false, sub: 'this academic year', color: '#f59e0b', bg: '#fef3c7' },
]

const DRIVES = [
  { company: 'Goldman Sachs', role: 'Analyst — Technology', date: '14 Aug 2026', status: 'Confirmed', logo: 'GS', logoColor: '#0d3b6e', logoBg: '#dbeafe' },
  { company: 'Infosys Ltd.', role: 'Systems Engineer', date: '19 Aug 2026', status: 'Confirmed', logo: 'IN', logoColor: '#6750a4', logoBg: '#ede9fe' },
  { company: 'Zomato', role: 'SDE – Backend', date: '22 Aug 2026', status: 'Pending', logo: 'ZO', logoColor: '#b91c1c', logoBg: '#fee2e2' },
  { company: 'Deloitte India', role: 'Consultant Trainee', date: '27 Aug 2026', status: 'Confirmed', logo: 'DE', logoColor: '#0f766e', logoBg: '#ccfbf1' },
  { company: 'Razorpay', role: 'Product Engineer', date: '02 Sep 2026', status: 'Pending', logo: 'RP', logoColor: '#0369a1', logoBg: '#e0f2fe' },
  { company: 'Amazon India', role: 'SDE-I', date: '05 Sep 2026', status: 'Invited', logo: 'AZ', logoColor: '#92400e', logoBg: '#fef3c7' },
  { company: 'HDFC Bank', role: 'Management Trainee', date: '10 Sep 2026', status: 'Confirmed', logo: 'HB', logoColor: '#1e40af', logoBg: '#dbeafe' },
]

const CHART_DATA = [
  { month: 'Sep', placed: 62 },
  { month: 'Oct', placed: 114 },
  { month: 'Nov', placed: 189 },
  { month: 'Dec', placed: 97 },
  { month: 'Jan', placed: 210 },
  { month: 'Feb', placed: 245 },
  { month: 'Mar', placed: 198 },
  { month: 'Apr', placed: 132 },
]

const DRIVE_STATUS: Record<string, { color: string; accent: string }> = {
  Confirmed: { color: '#15803d', accent: '#22c55e' },
  Pending: { color: '#b45309', accent: '#f59e0b' },
  Invited: { color: '#1d4ed8', accent: '#3b82f6' },
}

// ─────────────────────────────────────────────────────────────────────────────
// Students data
// ─────────────────────────────────────────────────────────────────────────────

type PlacementStatus = 'Eligible' | 'Applied' | 'Interviewing' | 'Offered' | 'Placed'

interface SemRecord { sem: number; gpa: number; backlogs: number }
interface Cert { name: string; issuer: string; year: number }
interface Application {
  company: string; role: string; date: string
  stage: 'Applied' | 'Shortlisted' | 'Written Test' | 'Technical Interview' | 'HR Round' | 'Offered' | 'Rejected'
  package?: string
}

interface Student {
  id: number
  name: string; initials: string; avatarColor: string; avatarBg: string
  roll: string; department: string; batch: string; semester: number
  cgpa: number; status: PlacementStatus; company?: string; resumeUrl: string
  email: string; phone: string; hometown: string
  github: string; linkedin: string; portfolio: string
  skills: string[]; certifications: Cert[]
  semRecords: SemRecord[]; graduationYear: number; totalBacklogs: number
  applications: Application[]
  bio: string
}

// Lightweight shapes used while a student is only partially loaded (e.g. the
// row that was clicked in the table, before /api/students/{id} responds).
interface StudentSummary { id: number; name: string; roll: string; department: string }
interface StudentListItem extends StudentSummary {
  initials: string; avatarColor: string; avatarBg: string
  batch: string; semester: number; cgpa: number; status: PlacementStatus; company?: string; resumeUrl: string
}

const STUDENTS: Student[] = [
  {
    id: 1, name: 'Priya Sharma', initials: 'PS', avatarColor: '#5b21b6', avatarBg: '#ede9fe',
    roll: 'CS21B042', department: 'Computer Science', batch: '2025', semester: 8,
    cgpa: 9.1, status: 'Placed', company: 'Google', resumeUrl: '#',
    email: 'priya.sharma@iith.ac.in', phone: '+91 98400 11234', hometown: 'Bengaluru, KA',
    github: 'github.com/priyasharma', linkedin: 'linkedin.com/in/priyasharma', portfolio: 'priyasharma.dev',
    bio: 'Full-stack engineer passionate about distributed systems and developer tooling. Google Summer of Code 2024 contributor.',
    skills: ['Python', 'React', 'Go', 'Kubernetes', 'PostgreSQL', 'GraphQL'],
    certifications: [
      { name: 'Google Cloud Professional', issuer: 'Google', year: 2024 },
      { name: 'AWS Solutions Architect', issuer: 'Amazon', year: 2023 },
    ],
    semRecords: [
      { sem: 1, gpa: 8.9, backlogs: 0 }, { sem: 2, gpa: 9.0, backlogs: 0 },
      { sem: 3, gpa: 9.2, backlogs: 0 }, { sem: 4, gpa: 9.1, backlogs: 0 },
      { sem: 5, gpa: 9.3, backlogs: 0 }, { sem: 6, gpa: 9.0, backlogs: 0 },
      { sem: 7, gpa: 9.2, backlogs: 0 },
    ],
    graduationYear: 2025, totalBacklogs: 0,
    applications: [
      { company: 'Google', role: 'SWE — L3', date: 'Feb 2026', stage: 'Offered', package: '₹42 LPA' },
      { company: 'Microsoft', role: 'SDE-II', date: 'Jan 2026', stage: 'HR Round' },
    ],
  },
  {
    id: 2, name: 'Arjun Mehta', initials: 'AM', avatarColor: '#0369a1', avatarBg: '#e0f2fe',
    roll: 'EC21B017', department: 'Electronics', batch: '2025', semester: 8,
    cgpa: 8.7, status: 'Offered', company: 'Qualcomm', resumeUrl: '#',
    email: 'arjun.mehta@iith.ac.in', phone: '+91 90000 22345', hometown: 'Jaipur, RJ',
    github: 'github.com/arjunmehta', linkedin: 'linkedin.com/in/arjunmehta', portfolio: '',
    bio: 'VLSI design enthusiast with focus on low-power embedded systems. Published IEEE paper on sensor fusion.',
    skills: ['VLSI Design', 'Verilog', 'MATLAB', 'Embedded C', 'Signal Processing'],
    certifications: [
      { name: 'Certified VLSI Design Engineer', issuer: 'VLSI Society of India', year: 2024 },
    ],
    semRecords: [
      { sem: 1, gpa: 8.4, backlogs: 0 }, { sem: 2, gpa: 8.6, backlogs: 0 },
      { sem: 3, gpa: 8.8, backlogs: 0 }, { sem: 4, gpa: 8.9, backlogs: 0 },
      { sem: 5, gpa: 8.7, backlogs: 0 }, { sem: 6, gpa: 8.5, backlogs: 0 },
      { sem: 7, gpa: 8.9, backlogs: 0 },
    ],
    graduationYear: 2025, totalBacklogs: 0,
    applications: [
      { company: 'Qualcomm', role: 'VLSI Engineer', date: 'Mar 2026', stage: 'Offered', package: '₹28 LPA' },
      { company: 'Intel', role: 'Hardware Engineer', date: 'Feb 2026', stage: 'Technical Interview' },
      { company: 'Texas Instruments', role: 'Analog Design', date: 'Jan 2026', stage: 'Rejected' },
    ],
  },
  {
    id: 3, name: 'Sneha Pillai', initials: 'SP', avatarColor: '#0f766e', avatarBg: '#ccfbf1',
    roll: 'ME21B031', department: 'Mechanical', batch: '2025', semester: 8,
    cgpa: 8.2, status: 'Interviewing', company: 'Tata Motors', resumeUrl: '#',
    email: 'sneha.pillai@iith.ac.in', phone: '+91 91234 33456', hometown: 'Kochi, KL',
    github: '', linkedin: 'linkedin.com/in/snehapillai', portfolio: '',
    bio: 'Mechanical engineer specialising in EV powertrain design. Internship at ISRO Propulsion Complex in 2024.',
    skills: ['AutoCAD', 'ANSYS', 'SolidWorks', 'Thermodynamics', 'FEA', 'Python'],
    certifications: [
      { name: 'Certified SolidWorks Professional', issuer: 'Dassault Systèmes', year: 2023 },
    ],
    semRecords: [
      { sem: 1, gpa: 7.9, backlogs: 0 }, { sem: 2, gpa: 8.1, backlogs: 0 },
      { sem: 3, gpa: 8.3, backlogs: 0 }, { sem: 4, gpa: 8.0, backlogs: 1 },
      { sem: 5, gpa: 8.4, backlogs: 0 }, { sem: 6, gpa: 8.5, backlogs: 0 },
      { sem: 7, gpa: 8.2, backlogs: 0 },
    ],
    graduationYear: 2025, totalBacklogs: 1,
    applications: [
      { company: 'Tata Motors', role: 'Graduate Engineer Trainee', date: 'Mar 2026', stage: 'Technical Interview' },
      { company: 'Mahindra', role: 'Design Engineer', date: 'Feb 2026', stage: 'Written Test' },
    ],
  },
  {
    id: 4, name: 'Rohan Gupta', initials: 'RG', avatarColor: '#b45309', avatarBg: '#fef3c7',
    roll: 'CS21B008', department: 'Computer Science', batch: '2025', semester: 8,
    cgpa: 7.9, status: 'Applied', resumeUrl: '#',
    email: 'rohan.gupta@iith.ac.in', phone: '+91 99876 44567', hometown: 'Lucknow, UP',
    github: 'github.com/rohangupta', linkedin: 'linkedin.com/in/rohangupta', portfolio: '',
    bio: 'Backend developer with interests in distributed databases and cloud-native architecture.',
    skills: ['Java', 'Spring Boot', 'MySQL', 'Docker', 'Kafka', 'AWS'],
    certifications: [
      { name: 'Oracle Certified Java SE 11', issuer: 'Oracle', year: 2024 },
    ],
    semRecords: [
      { sem: 1, gpa: 7.6, backlogs: 1 }, { sem: 2, gpa: 7.8, backlogs: 0 },
      { sem: 3, gpa: 7.9, backlogs: 0 }, { sem: 4, gpa: 8.0, backlogs: 0 },
      { sem: 5, gpa: 7.8, backlogs: 0 }, { sem: 6, gpa: 8.1, backlogs: 0 },
      { sem: 7, gpa: 7.9, backlogs: 0 },
    ],
    graduationYear: 2025, totalBacklogs: 1,
    applications: [
      { company: 'Razorpay', role: 'Backend Engineer', date: 'Mar 2026', stage: 'Shortlisted' },
      { company: 'Swiggy', role: 'SDE-I', date: 'Feb 2026', stage: 'Applied' },
      { company: 'PhonePe', role: 'SDE-I', date: 'Jan 2026', stage: 'Rejected' },
    ],
  },
  {
    id: 5, name: 'Aishwarya Nair', initials: 'AN', avatarColor: '#be185d', avatarBg: '#fce7f3',
    roll: 'CE21B055', department: 'Civil', batch: '2025', semester: 8,
    cgpa: 8.4, status: 'Placed', company: 'L&T', resumeUrl: '#',
    email: 'aishwarya.nair@iith.ac.in', phone: '+91 97000 55678', hometown: 'Thrissur, KL',
    github: '', linkedin: 'linkedin.com/in/aishwaryanair', portfolio: '',
    bio: "Structural engineer focused on sustainable construction. Project lead for IIT-H's Green Building initiative.",
    skills: ['STAAD.Pro', 'AutoCAD Civil 3D', 'REVIT', 'MS Project', 'Cost Estimation'],
    certifications: [
      { name: 'LEED Green Associate', issuer: 'USGBC', year: 2024 },
      { name: 'PMP Foundation', issuer: 'PMI', year: 2023 },
    ],
    semRecords: [
      { sem: 1, gpa: 8.1, backlogs: 0 }, { sem: 2, gpa: 8.3, backlogs: 0 },
      { sem: 3, gpa: 8.5, backlogs: 0 }, { sem: 4, gpa: 8.4, backlogs: 0 },
      { sem: 5, gpa: 8.6, backlogs: 0 }, { sem: 6, gpa: 8.2, backlogs: 0 },
      { sem: 7, gpa: 8.5, backlogs: 0 },
    ],
    graduationYear: 2025, totalBacklogs: 0,
    applications: [
      { company: 'L&T Construction', role: 'Graduate Engineer', date: 'Feb 2026', stage: 'Offered', package: '₹12 LPA' },
    ],
  },
  {
    id: 6, name: 'Karthik Rajan', initials: 'KR', avatarColor: '#1d4ed8', avatarBg: '#dbeafe',
    roll: 'CS21B029', department: 'Computer Science', batch: '2025', semester: 8,
    cgpa: 9.4, status: 'Placed', company: 'Microsoft', resumeUrl: '#',
    email: 'karthik.rajan@iith.ac.in', phone: '+91 94455 66789', hometown: 'Chennai, TN',
    github: 'github.com/karthikrajan', linkedin: 'linkedin.com/in/karthikrajan', portfolio: 'karthikrajan.io',
    bio: 'Systems programmer and competitive coder. ICPC Asia Regionals 2024 finalist. Loves compilers and OS internals.',
    skills: ['C++', 'Rust', 'Systems Programming', 'Competitive Programming', 'Linux', 'LLVM'],
    certifications: [
      { name: 'Microsoft Azure Fundamentals', issuer: 'Microsoft', year: 2024 },
    ],
    semRecords: [
      { sem: 1, gpa: 9.2, backlogs: 0 }, { sem: 2, gpa: 9.3, backlogs: 0 },
      { sem: 3, gpa: 9.5, backlogs: 0 }, { sem: 4, gpa: 9.4, backlogs: 0 },
      { sem: 5, gpa: 9.6, backlogs: 0 }, { sem: 6, gpa: 9.3, backlogs: 0 },
      { sem: 7, gpa: 9.5, backlogs: 0 },
    ],
    graduationYear: 2025, totalBacklogs: 0,
    applications: [
      { company: 'Microsoft', role: 'SDE-II', date: 'Jan 2026', stage: 'Offered', package: '₹45 LPA' },
      { company: 'Google', role: 'SWE L4', date: 'Dec 2025', stage: 'HR Round' },
    ],
  },
  {
    id: 7, name: 'Divya Krishnamurthy', initials: 'DK', avatarColor: '#065f46', avatarBg: '#d1fae5',
    roll: 'CH21B011', department: 'Chemical', batch: '2025', semester: 8,
    cgpa: 7.6, status: 'Eligible', resumeUrl: '#',
    email: 'divya.k@iith.ac.in', phone: '+91 98001 77890', hometown: 'Coimbatore, TN',
    github: '', linkedin: 'linkedin.com/in/divyak', portfolio: '',
    bio: 'Chemical process engineer with research interest in catalytic reactors and green chemistry.',
    skills: ['HYSYS', 'Aspen Plus', 'Process Simulation', 'MATLAB', 'Statistical Analysis'],
    certifications: [],
    semRecords: [
      { sem: 1, gpa: 7.2, backlogs: 1 }, { sem: 2, gpa: 7.5, backlogs: 0 },
      { sem: 3, gpa: 7.8, backlogs: 0 }, { sem: 4, gpa: 7.6, backlogs: 1 },
      { sem: 5, gpa: 7.7, backlogs: 0 }, { sem: 6, gpa: 7.9, backlogs: 0 },
      { sem: 7, gpa: 7.5, backlogs: 0 },
    ],
    graduationYear: 2025, totalBacklogs: 2,
    applications: [],
  },
  {
    id: 8, name: 'Sahil Agarwal', initials: 'SA', avatarColor: '#6b21a8', avatarBg: '#f3e8ff',
    roll: 'CS22B003', department: 'Computer Science', batch: '2026', semester: 6,
    cgpa: 8.8, status: 'Applied', resumeUrl: '#',
    email: 'sahil.agarwal@iith.ac.in', phone: '+91 87654 88901', hometown: 'Delhi, DL',
    github: 'github.com/sahilagarwal', linkedin: 'linkedin.com/in/sahilagarwal', portfolio: '',
    bio: 'ML enthusiast building real-time inference systems. Research intern at Microsoft Research India.',
    skills: ['Python', 'PyTorch', 'TensorFlow', 'MLOps', 'FastAPI', 'Redis'],
    certifications: [
      { name: 'Deep Learning Specialization', issuer: 'Coursera / DeepLearning.AI', year: 2024 },
    ],
    semRecords: [
      { sem: 1, gpa: 8.5, backlogs: 0 }, { sem: 2, gpa: 8.7, backlogs: 0 },
      { sem: 3, gpa: 8.9, backlogs: 0 }, { sem: 4, gpa: 8.8, backlogs: 0 },
      { sem: 5, gpa: 9.0, backlogs: 0 },
    ],
    graduationYear: 2026, totalBacklogs: 0,
    applications: [
      { company: 'Flipkart', role: 'SDE-I', date: 'Mar 2026', stage: 'Shortlisted' },
      { company: 'Meesho', role: 'ML Engineer', date: 'Feb 2026', stage: 'Applied' },
    ],
  },
  {
    id: 9, name: 'Tanvi Desai', initials: 'TD', avatarColor: '#c2410c', avatarBg: '#ffedd5', roll: 'EC22B044', department: 'Electronics', batch: '2026', semester: 6, cgpa: 8.1, status: 'Eligible', resumeUrl: '#', email: 'tanvi.desai@iith.ac.in', phone: '+91 99000 99012', hometown: 'Ahmedabad, GJ', github: '', linkedin: 'linkedin.com/in/tanvidesai', portfolio: '', bio: 'Embedded systems developer interested in IoT and edge computing.', skills: ['Embedded C', 'ARM Cortex', 'PCB Design', 'RTOS', 'Python'], certifications: [], semRecords: [{ sem: 1, gpa: 7.9, backlogs: 0 }, { sem: 2, gpa: 8.1, backlogs: 0 }, { sem: 3, gpa: 8.2, backlogs: 0 }, { sem: 4, gpa: 8.0, backlogs: 0 }, { sem: 5, gpa: 8.3, backlogs: 0 }], graduationYear: 2026, totalBacklogs: 0, applications: [],
  },
  {
    id: 10, name: 'Varun Iyer', initials: 'VI', avatarColor: '#0e7490', avatarBg: '#cffafe', roll: 'ME22B019', department: 'Mechanical', batch: '2026', semester: 6, cgpa: 7.4, status: 'Eligible', resumeUrl: '#', email: 'varun.iyer@iith.ac.in', phone: '+91 90123 10123', hometown: 'Mysuru, KA', github: '', linkedin: 'linkedin.com/in/varuniyer', portfolio: '', bio: 'Mechanical engineering student focused on robotics and automation.', skills: ['ROS', 'SolidWorks', 'C++', 'Arduino', 'MATLAB'], certifications: [], semRecords: [{ sem: 1, gpa: 7.0, backlogs: 1 }, { sem: 2, gpa: 7.3, backlogs: 0 }, { sem: 3, gpa: 7.5, backlogs: 0 }, { sem: 4, gpa: 7.4, backlogs: 0 }, { sem: 5, gpa: 7.8, backlogs: 0 }], graduationYear: 2026, totalBacklogs: 1, applications: [],
  },
  {
    id: 11, name: 'Meera Venkatesh', initials: 'MV', avatarColor: '#15803d', avatarBg: '#dcfce7', roll: 'CS21B063', department: 'Computer Science', batch: '2025', semester: 8, cgpa: 8.6, status: 'Placed', company: 'Flipkart', resumeUrl: '#', email: 'meera.v@iith.ac.in', phone: '+91 94000 11234', hometown: 'Hyderabad, TS', github: 'github.com/meerav', linkedin: 'linkedin.com/in/meerav', portfolio: '', bio: 'Product-minded engineer who loves building consumer-facing systems at scale.', skills: ['TypeScript', 'Node.js', 'React', 'MongoDB', 'Redis', 'System Design'], certifications: [{ name: 'Meta Front-End Developer', issuer: 'Coursera', year: 2023 }], semRecords: [{ sem: 1, gpa: 8.3, backlogs: 0 }, { sem: 2, gpa: 8.5, backlogs: 0 }, { sem: 3, gpa: 8.7, backlogs: 0 }, { sem: 4, gpa: 8.6, backlogs: 0 }, { sem: 5, gpa: 8.8, backlogs: 0 }, { sem: 6, gpa: 8.4, backlogs: 0 }, { sem: 7, gpa: 8.7, backlogs: 0 }], graduationYear: 2025, totalBacklogs: 0, applications: [{ company: 'Flipkart', role: 'SDE-I', date: 'Feb 2026', stage: 'Offered', package: '₹24 LPA' }],
  },
  {
    id: 12, name: 'Ankit Bose', initials: 'AB', avatarColor: '#9f1239', avatarBg: '#ffe4e6', roll: 'CS22B027', department: 'Computer Science', batch: '2026', semester: 6, cgpa: 7.2, status: 'Applied', resumeUrl: '#', email: 'ankit.bose@iith.ac.in', phone: '+91 91111 22333', hometown: 'Kolkata, WB', github: 'github.com/ankitbose', linkedin: 'linkedin.com/in/ankitbose', portfolio: '', bio: 'Full-stack developer building side projects in the fintech space.', skills: ['JavaScript', 'React', 'Express', 'PostgreSQL', 'Figma'], certifications: [], semRecords: [{ sem: 1, gpa: 7.0, backlogs: 1 }, { sem: 2, gpa: 7.2, backlogs: 0 }, { sem: 3, gpa: 7.3, backlogs: 0 }, { sem: 4, gpa: 7.1, backlogs: 1 }, { sem: 5, gpa: 7.4, backlogs: 0 }], graduationYear: 2026, totalBacklogs: 2, applications: [{ company: 'CRED', role: 'Frontend Engineer', date: 'Mar 2026', stage: 'Applied' }],
  },
  {
    id: 13, name: 'Lakshmi Subramaniam', initials: 'LS', avatarColor: '#92400e', avatarBg: '#fef3c7', roll: 'CE21B038', department: 'Civil', batch: '2025', semester: 8, cgpa: 8.0, status: 'Interviewing', company: 'Afcons', resumeUrl: '#', email: 'lakshmi.s@iith.ac.in', phone: '+91 98765 33444', hometown: 'Madurai, TN', github: '', linkedin: 'linkedin.com/in/lakshmis', portfolio: '', bio: 'Infrastructure and transportation engineer. Passionate about urban mobility.', skills: ['STAAD.Pro', 'AutoCAD', 'GIS', 'Project Management', 'HEC-RAS'], certifications: [{ name: 'PMP Foundation', issuer: 'PMI', year: 2024 }], semRecords: [{ sem: 1, gpa: 7.8, backlogs: 0 }, { sem: 2, gpa: 7.9, backlogs: 0 }, { sem: 3, gpa: 8.1, backlogs: 0 }, { sem: 4, gpa: 8.0, backlogs: 0 }, { sem: 5, gpa: 8.2, backlogs: 0 }, { sem: 6, gpa: 7.9, backlogs: 0 }, { sem: 7, gpa: 8.1, backlogs: 0 }], graduationYear: 2025, totalBacklogs: 0, applications: [{ company: 'Afcons Infrastructure', role: 'Site Engineer', date: 'Mar 2026', stage: 'Technical Interview' }, { company: 'NCC Ltd.', role: 'Graduate Trainee', date: 'Feb 2026', stage: 'Shortlisted' }],
  },
  {
    id: 14, name: 'Nikhil Patel', initials: 'NP', avatarColor: '#1e3a8a', avatarBg: '#dbeafe', roll: 'EC21B052', department: 'Electronics', batch: '2025', semester: 8, cgpa: 8.9, status: 'Offered', company: 'Texas Instruments', resumeUrl: '#', email: 'nikhil.patel@iith.ac.in', phone: '+91 97500 44555', hometown: 'Surat, GJ', github: 'github.com/nikhilpatel', linkedin: 'linkedin.com/in/nikhilpatel', portfolio: '', bio: 'Analog IC design enthusiast. Filed a patent on low-power ADC design during final year project.', skills: ['Analog Design', 'Cadence Virtuoso', 'Verilog-A', 'SPICE', 'PCB Layout'], certifications: [{ name: 'Cadence PCB Design Associate', issuer: 'Cadence', year: 2024 }], semRecords: [{ sem: 1, gpa: 8.6, backlogs: 0 }, { sem: 2, gpa: 8.8, backlogs: 0 }, { sem: 3, gpa: 9.0, backlogs: 0 }, { sem: 4, gpa: 8.9, backlogs: 0 }, { sem: 5, gpa: 9.1, backlogs: 0 }, { sem: 6, gpa: 8.8, backlogs: 0 }, { sem: 7, gpa: 9.0, backlogs: 0 }], graduationYear: 2025, totalBacklogs: 0, applications: [{ company: 'Texas Instruments', role: 'Analog Design Engineer', date: 'Mar 2026', stage: 'Offered', package: '₹32 LPA' }, { company: 'Qualcomm', role: 'RFIC Engineer', date: 'Feb 2026', stage: 'HR Round' }],
  },
  {
    id: 15, name: 'Rhea Kapoor', initials: 'RK', avatarColor: '#4d7c0f', avatarBg: '#ecfccb', roll: 'CH22B008', department: 'Chemical', batch: '2026', semester: 6, cgpa: 7.8, status: 'Eligible', resumeUrl: '#', email: 'rhea.kapoor@iith.ac.in', phone: '+91 96000 55666', hometown: 'Pune, MH', github: '', linkedin: 'linkedin.com/in/rheakapoor', portfolio: '', bio: 'Chemical engineer with a minor in data science, interested in pharma process engineering.', skills: ['Aspen Plus', 'Python', 'MATLAB', 'Statistical Process Control', 'Six Sigma'], certifications: [{ name: 'Six Sigma Yellow Belt', issuer: 'ASQ', year: 2024 }], semRecords: [{ sem: 1, gpa: 7.5, backlogs: 0 }, { sem: 2, gpa: 7.7, backlogs: 0 }, { sem: 3, gpa: 7.9, backlogs: 0 }, { sem: 4, gpa: 7.8, backlogs: 0 }, { sem: 5, gpa: 8.0, backlogs: 0 }], graduationYear: 2026, totalBacklogs: 0, applications: [],
  },
]

const PLACEMENT_STATUS_STYLE: Record<PlacementStatus, { bg: string; color: string; accent: string }> = {
  Eligible: { bg: '#f1f5f9', color: '#475569', accent: '#64748b' },
  Applied: { bg: '#dbeafe', color: '#1d4ed8', accent: '#3b82f6' },
  Interviewing: { bg: '#fef9c3', color: '#a16207', accent: '#eab308' },
  Offered: { bg: '#ffedd5', color: '#c2410c', accent: '#f97316' },
  Placed: { bg: '#dcfce7', color: '#15803d', accent: '#22c55e' },
}

const DEPARTMENTS = ['All Departments', 'Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Chemical']
const BATCHES = ['All Batches', '2025', '2026']
const STATUSES: ('All Statuses' | PlacementStatus)[] = ['All Statuses', 'Eligible', 'Applied', 'Interviewing', 'Offered', 'Placed']

// ─────────────────────────────────────────────────────────────────────────────
// Placements data
// ─────────────────────────────────────────────────────────────────────────────

type PlacementStage = 'Applied' | 'Shortlisted' | 'Interviewing' | 'Offered' | 'Joined'

interface PlacementApp {
  id: number
  student: string; initials: string; avatarColor: string; avatarBg: string
  roll: string; department: string
  company: string; role: string; appliedDate: string
  stage: PlacementStage
  package?: string; offerDate?: string; joiningDate?: string
}

const PLACEMENT_STAGE_STYLE: Record<PlacementStage, { color: string; accent: string }> = {
  Applied: { color: '#475569', accent: '#64748b' },
  Shortlisted: { color: '#1d4ed8', accent: '#3b82f6' },
  Interviewing: { color: '#a16207', accent: '#eab308' },
  Offered: { color: '#c2410c', accent: '#f97316' },
  Joined: { color: '#15803d', accent: '#22c55e' },
}

const PLACEMENT_STAGES: PlacementStage[] = ['Applied', 'Shortlisted', 'Interviewing', 'Offered', 'Joined']

const PLACEMENT_APPS: PlacementApp[] = [
  { id: 1, student: 'Priya Sharma', initials: 'PS', avatarColor: '#5b21b6', avatarBg: '#ede9fe', roll: 'CS21B042', department: 'Computer Science', company: 'Google', role: 'SWE — L3', appliedDate: 'Feb 2026', stage: 'Joined', package: '₹42 LPA', offerDate: 'Mar 2026', joiningDate: 'Jul 2026' },
  { id: 2, student: 'Karthik Rajan', initials: 'KR', avatarColor: '#1d4ed8', avatarBg: '#dbeafe', roll: 'CS21B029', department: 'Computer Science', company: 'Microsoft', role: 'SDE-II', appliedDate: 'Jan 2026', stage: 'Joined', package: '₹45 LPA', offerDate: 'Feb 2026', joiningDate: 'Jul 2026' },
  { id: 3, student: 'Meera Venkatesh', initials: 'MV', avatarColor: '#15803d', avatarBg: '#dcfce7', roll: 'CS21B063', department: 'Computer Science', company: 'Flipkart', role: 'SDE-I', appliedDate: 'Feb 2026', stage: 'Joined', package: '₹24 LPA', offerDate: 'Mar 2026', joiningDate: 'Jun 2026' },
  { id: 4, student: 'Aishwarya Nair', initials: 'AN', avatarColor: '#be185d', avatarBg: '#fce7f3', roll: 'CE21B055', department: 'Civil', company: 'L&T Construction', role: 'Graduate Engineer', appliedDate: 'Feb 2026', stage: 'Joined', package: '₹12 LPA', offerDate: 'Feb 2026', joiningDate: 'Jun 2026' },
  { id: 5, student: 'Arjun Mehta', initials: 'AM', avatarColor: '#0369a1', avatarBg: '#e0f2fe', roll: 'EC21B017', department: 'Electronics', company: 'Qualcomm', role: 'VLSI Engineer', appliedDate: 'Feb 2026', stage: 'Offered', package: '₹28 LPA', offerDate: 'Mar 2026' },
  { id: 6, student: 'Nikhil Patel', initials: 'NP', avatarColor: '#1e3a8a', avatarBg: '#dbeafe', roll: 'EC21B052', department: 'Electronics', company: 'Texas Instruments', role: 'Analog Design Engineer', appliedDate: 'Mar 2026', stage: 'Offered', package: '₹32 LPA', offerDate: 'Apr 2026' },
  { id: 7, student: 'Sneha Pillai', initials: 'SP', avatarColor: '#0f766e', avatarBg: '#ccfbf1', roll: 'ME21B031', department: 'Mechanical', company: 'Tata Motors', role: 'Graduate Engineer Trainee', appliedDate: 'Mar 2026', stage: 'Interviewing' },
  { id: 8, student: 'Arjun Mehta', initials: 'AM', avatarColor: '#0369a1', avatarBg: '#e0f2fe', roll: 'EC21B017', department: 'Electronics', company: 'Intel', role: 'Hardware Engineer', appliedDate: 'Feb 2026', stage: 'Interviewing' },
  { id: 9, student: 'Lakshmi Subramaniam', initials: 'LS', avatarColor: '#92400e', avatarBg: '#fef3c7', roll: 'CE21B038', department: 'Civil', company: 'Afcons Infrastructure', role: 'Site Engineer', appliedDate: 'Mar 2026', stage: 'Interviewing' },
  { id: 10, student: 'Rohan Gupta', initials: 'RG', avatarColor: '#b45309', avatarBg: '#fef3c7', roll: 'CS21B008', department: 'Computer Science', company: 'Razorpay', role: 'Backend Engineer', appliedDate: 'Mar 2026', stage: 'Shortlisted' },
  { id: 11, student: 'Sahil Agarwal', initials: 'SA', avatarColor: '#6b21a8', avatarBg: '#f3e8ff', roll: 'CS22B003', department: 'Computer Science', company: 'Flipkart', role: 'SDE-I', appliedDate: 'Mar 2026', stage: 'Shortlisted' },
  { id: 12, student: 'Ankit Bose', initials: 'AB', avatarColor: '#9f1239', avatarBg: '#ffe4e6', roll: 'CS22B027', department: 'Computer Science', company: 'CRED', role: 'Frontend Engineer', appliedDate: 'Mar 2026', stage: 'Applied' },
  { id: 13, student: 'Rohan Gupta', initials: 'RG', avatarColor: '#b45309', avatarBg: '#fef3c7', roll: 'CS21B008', department: 'Computer Science', company: 'Swiggy', role: 'SDE-I', appliedDate: 'Feb 2026', stage: 'Applied' },
  { id: 14, student: 'Lakshmi Subramaniam', initials: 'LS', avatarColor: '#92400e', avatarBg: '#fef3c7', roll: 'CE21B038', department: 'Civil', company: 'NCC Ltd.', role: 'Graduate Trainee', appliedDate: 'Feb 2026', stage: 'Shortlisted' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Internships data
// ─────────────────────────────────────────────────────────────────────────────

type InternshipStatus = 'Ongoing' | 'Completed' | 'Withdrawn'

interface Internship {
  id: number
  student: string; initials: string; avatarColor: string; avatarBg: string
  roll: string; department: string
  company: string; role: string
  duration: string; startDate: string; endDate: string
  mentor: string; stipend: string
  ppoEligible: boolean; ppoConverted: boolean
  status: InternshipStatus
}

const INTERNSHIP_STATUS_STYLE: Record<InternshipStatus, { color: string; accent: string }> = {
  Ongoing: { color: '#1d4ed8', accent: '#3b82f6' },
  Completed: { color: '#15803d', accent: '#22c55e' },
  Withdrawn: { color: '#64748b', accent: '#64748b' },
}

const INTERNSHIPS_DATA: Internship[] = [
  { id: 1, student: 'Priya Sharma', initials: 'PS', avatarColor: '#5b21b6', avatarBg: '#ede9fe', roll: 'CS21B042', department: 'Computer Science', company: 'Google', role: 'SWE Intern', duration: '3 months', startDate: 'May 2025', endDate: 'Jul 2025', mentor: 'Rajan Krishnamurthy', stipend: '₹1.2L/mo', ppoEligible: true, ppoConverted: true, status: 'Completed' },
  { id: 2, student: 'Karthik Rajan', initials: 'KR', avatarColor: '#1d4ed8', avatarBg: '#dbeafe', roll: 'CS21B029', department: 'Computer Science', company: 'Microsoft', role: 'SWE Intern', duration: '3 months', startDate: 'May 2025', endDate: 'Jul 2025', mentor: 'Preethi Nair', stipend: '₹1.5L/mo', ppoEligible: true, ppoConverted: true, status: 'Completed' },
  { id: 3, student: 'Meera Venkatesh', initials: 'MV', avatarColor: '#15803d', avatarBg: '#dcfce7', roll: 'CS21B063', department: 'Computer Science', company: 'Flipkart', role: 'Product Engineering Intern', duration: '3 months', startDate: 'May 2025', endDate: 'Jul 2025', mentor: 'Divya Mehta', stipend: '₹80K/mo', ppoEligible: true, ppoConverted: true, status: 'Completed' },
  { id: 4, student: 'Sahil Agarwal', initials: 'SA', avatarColor: '#6b21a8', avatarBg: '#f3e8ff', roll: 'CS22B003', department: 'Computer Science', company: 'Microsoft Research', role: 'Research Intern', duration: '6 months', startDate: 'Jan 2026', endDate: 'Jun 2026', mentor: 'Dr. Suresh Babu', stipend: '₹80K/mo', ppoEligible: true, ppoConverted: false, status: 'Ongoing' },
  { id: 5, student: 'Tanvi Desai', initials: 'TD', avatarColor: '#c2410c', avatarBg: '#ffedd5', roll: 'EC22B044', department: 'Electronics', company: 'Bosch India', role: 'Embedded Systems Intern', duration: '3 months', startDate: 'May 2026', endDate: 'Jul 2026', mentor: 'Ravi Menon', stipend: '₹35K/mo', ppoEligible: true, ppoConverted: false, status: 'Ongoing' },
  { id: 6, student: 'Ankit Bose', initials: 'AB', avatarColor: '#9f1239', avatarBg: '#ffe4e6', roll: 'CS22B027', department: 'Computer Science', company: 'CRED', role: 'Frontend Intern', duration: '3 months', startDate: 'May 2026', endDate: 'Jul 2026', mentor: 'Arjun Kapoor', stipend: '₹40K/mo', ppoEligible: true, ppoConverted: false, status: 'Ongoing' },
  { id: 7, student: 'Rhea Kapoor', initials: 'RK', avatarColor: '#4d7c0f', avatarBg: '#ecfccb', roll: 'CH22B008', department: 'Chemical', company: "Dr. Reddy's Labs", role: 'Process Engineering Intern', duration: '2 months', startDate: 'May 2026', endDate: 'Jun 2026', mentor: 'Dr. Priya Sharma', stipend: '₹20K/mo', ppoEligible: false, ppoConverted: false, status: 'Ongoing' },
  { id: 8, student: 'Sneha Pillai', initials: 'SP', avatarColor: '#0f766e', avatarBg: '#ccfbf1', roll: 'ME21B031', department: 'Mechanical', company: 'ISRO Propulsion', role: 'Engineering Intern', duration: '2 months', startDate: 'Jun 2024', endDate: 'Jul 2024', mentor: 'Dr. A.K. Menon', stipend: '₹25K/mo', ppoEligible: false, ppoConverted: false, status: 'Completed' },
  { id: 9, student: 'Rohan Gupta', initials: 'RG', avatarColor: '#b45309', avatarBg: '#fef3c7', roll: 'CS21B008', department: 'Computer Science', company: 'Swiggy', role: 'Backend Intern', duration: '2 months', startDate: 'Jun 2025', endDate: 'Jul 2025', mentor: 'Aditya Singh', stipend: '₹60K/mo', ppoEligible: true, ppoConverted: false, status: 'Completed' },
  { id: 10, student: 'Aishwarya Nair', initials: 'AN', avatarColor: '#be185d', avatarBg: '#fce7f3', roll: 'CE21B055', department: 'Civil', company: 'L&T ECC', role: 'Site Intern', duration: '2 months', startDate: 'Dec 2024', endDate: 'Jan 2025', mentor: 'Vijay Nair', stipend: '₹15K/mo', ppoEligible: false, ppoConverted: false, status: 'Completed' },
  { id: 11, student: 'Varun Iyer', initials: 'VI', avatarColor: '#0e7490', avatarBg: '#cffafe', roll: 'ME22B019', department: 'Mechanical', company: 'Ather Energy', role: 'Robotics Intern', duration: '3 months', startDate: 'Dec 2025', endDate: 'Feb 2026', mentor: 'Kiran Bhat', stipend: '₹30K/mo', ppoEligible: true, ppoConverted: false, status: 'Withdrawn' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Placement Drives page data
// ─────────────────────────────────────────────────────────────────────────────

type DriveStatus2 = 'Open' | 'Upcoming' | 'Completed' | 'Closed'
type DriveType = 'FTE' | 'Internship' | 'FTE + Internship'

interface PlacementDrive {
  id: number
  company: string; logo: string; logoColor: string; logoBg: string
  position: string; package: string; type: DriveType
  eligibility: string; skills: string[]
  registrationDeadline: string; interviewDate: string; venue: string
  status: DriveStatus2; applications: number
}

const DRIVE_PAGE_STATUS: Record<DriveStatus2, { color: string; accent: string }> = {
  Open: { color: '#1d4ed8', accent: '#3b82f6' },
  Upcoming: { color: '#a16207', accent: '#f59e0b' },
  Completed: { color: '#15803d', accent: '#22c55e' },
  Closed: { color: '#64748b', accent: '#64748b' },
}

const DRIVES_DATA: PlacementDrive[] = [
  { id: 1, company: 'Google', logo: 'GO', logoColor: '#1a73e8', logoBg: '#dbeafe', position: 'SWE — L3', package: '₹42 LPA', type: 'FTE', eligibility: 'CGPA ≥ 8.0, CS/EC departments, No active backlogs', skills: ['Python', 'Algorithms', 'System Design'], registrationDeadline: '10 Jan 2026', interviewDate: '25 Jan 2026', venue: 'Online', status: 'Completed', applications: 48 },
  { id: 2, company: 'Microsoft', logo: 'MS', logoColor: '#005a9e', logoBg: '#dbeafe', position: 'SDE-II', package: '₹45 LPA', type: 'FTE', eligibility: 'CGPA ≥ 7.5, All departments', skills: ['C++', 'DSA', 'OOP'], registrationDeadline: '15 Jan 2026', interviewDate: '28 Jan 2026', venue: 'Hyderabad Campus', status: 'Completed', applications: 61 },
  { id: 3, company: 'Goldman Sachs', logo: 'GS', logoColor: '#0d3b6e', logoBg: '#dbeafe', position: 'Analyst — Technology', package: '₹38 LPA', type: 'FTE', eligibility: 'CGPA ≥ 8.5, CS / Mathematics', skills: ['Python', 'Finance Basics', 'SQL'], registrationDeadline: '05 Aug 2026', interviewDate: '14 Aug 2026', venue: 'Hyderabad Campus', status: 'Open', applications: 34 },
  { id: 4, company: 'Infosys Ltd.', logo: 'IN', logoColor: '#6750a4', logoBg: '#ede9fe', position: 'Systems Engineer', package: '₹7.5 LPA', type: 'FTE', eligibility: 'CGPA ≥ 6.5, All departments', skills: ['Java', 'DBMS', 'Networking'], registrationDeadline: '10 Aug 2026', interviewDate: '19 Aug 2026', venue: 'Hyderabad Campus', status: 'Open', applications: 112 },
  { id: 5, company: 'Flipkart', logo: 'FK', logoColor: '#0369a1', logoBg: '#e0f2fe', position: 'SDE-I', package: '₹24 LPA', type: 'FTE', eligibility: 'CGPA ≥ 7.0, CS departments only', skills: ['React', 'Node.js', 'System Design'], registrationDeadline: '18 Aug 2026', interviewDate: '28 Aug 2026', venue: 'Hyderabad Campus', status: 'Open', applications: 57 },
  { id: 6, company: 'Zomato', logo: 'ZO', logoColor: '#b91c1c', logoBg: '#fee2e2', position: 'SDE — Backend', package: '₹26 LPA', type: 'Internship', eligibility: 'CGPA ≥ 7.0, CS/EC departments', skills: ['Go', 'Kafka', 'Microservices'], registrationDeadline: '12 Aug 2026', interviewDate: '22 Aug 2026', venue: 'Online', status: 'Open', applications: 29 },
  { id: 7, company: 'Deloitte India', logo: 'DE', logoColor: '#0f766e', logoBg: '#ccfbf1', position: 'Consultant Trainee', package: '₹11 LPA', type: 'FTE', eligibility: 'CGPA ≥ 7.5, All departments', skills: ['Consulting', 'Excel', 'Communication'], registrationDeadline: '15 Aug 2026', interviewDate: '27 Aug 2026', venue: 'Hyderabad Campus', status: 'Open', applications: 43 },
  { id: 8, company: 'Razorpay', logo: 'RP', logoColor: '#0369a1', logoBg: '#e0f2fe', position: 'Product Engineer', package: '₹28 LPA', type: 'FTE', eligibility: 'CGPA ≥ 7.0, CS departments only', skills: ['React', 'Node.js', 'System Design'], registrationDeadline: '25 Aug 2026', interviewDate: '02 Sep 2026', venue: 'Online', status: 'Upcoming', applications: 0 },
  { id: 9, company: 'Amazon India', logo: 'AZ', logoColor: '#92400e', logoBg: '#fef3c7', position: 'SDE-I', package: '₹32 LPA', type: 'FTE + Internship', eligibility: 'CGPA ≥ 7.5, CS/EC departments', skills: ['Java', 'DSA', 'System Design', 'AWS'], registrationDeadline: '28 Aug 2026', interviewDate: '05 Sep 2026', venue: 'Online', status: 'Upcoming', applications: 0 },
  { id: 10, company: 'HDFC Bank', logo: 'HB', logoColor: '#1e40af', logoBg: '#dbeafe', position: 'Management Trainee', package: '₹12 LPA', type: 'FTE', eligibility: 'CGPA ≥ 7.0, All departments', skills: ['Analytical Thinking', 'Communication', 'Excel'], registrationDeadline: '30 Aug 2026', interviewDate: '10 Sep 2026', venue: 'Mumbai', status: 'Upcoming', applications: 0 },
]

// ─────────────────────────────────────────────────────────────────────────────
// Companies CRM data
// ─────────────────────────────────────────────────────────────────────────────

interface CRMCompany {
  id: number
  name: string; logo: string; logoColor: string; logoBg: string
  industry: string; location: string
  hrName: string; hrEmail: string; hrPhone: string
  pastVisits: number; studentsHired: number; avgPackage: string; highestPackage: string
  lastVisit: string
  jobHistory: { year: string; role: string; hired: number; pkg: string }[]
}

const COMPANIES_DATA: CRMCompany[] = [
  { id: 1, name: 'Google', logo: 'GO', logoColor: '#1a73e8', logoBg: '#dbeafe', industry: 'Technology', location: 'Hyderabad / Remote', hrName: 'Shreya Kapoor', hrEmail: 'shreya.kapoor@google.com', hrPhone: '+91 98400 11000', pastVisits: 4, studentsHired: 12, avgPackage: '₹38 LPA', highestPackage: '₹42 LPA', lastVisit: 'Jan 2026', jobHistory: [{ year: '2026', role: 'SWE — L3', hired: 3, pkg: '₹42 LPA' }, { year: '2025', role: 'SWE — L3', hired: 4, pkg: '₹38 LPA' }, { year: '2024', role: 'SWE Intern', hired: 3, pkg: '₹1.2L/mo' }, { year: '2023', role: 'SWE — L3', hired: 2, pkg: '₹35 LPA' }] },
  { id: 2, name: 'Microsoft', logo: 'MS', logoColor: '#005a9e', logoBg: '#dbeafe', industry: 'Technology', location: 'Hyderabad', hrName: 'Anand Rao', hrEmail: 'anand.rao@microsoft.com', hrPhone: '+91 90000 22000', pastVisits: 5, studentsHired: 18, avgPackage: '₹40 LPA', highestPackage: '₹45 LPA', lastVisit: 'Jan 2026', jobHistory: [{ year: '2026', role: 'SDE-II', hired: 4, pkg: '₹45 LPA' }, { year: '2025', role: 'SDE-I', hired: 5, pkg: '₹40 LPA' }, { year: '2024', role: 'SWE Intern', hired: 4, pkg: '₹1.5L/mo' }, { year: '2023', role: 'SDE-I', hired: 3, pkg: '₹36 LPA' }, { year: '2022', role: 'SDE-I', hired: 2, pkg: '₹33 LPA' }] },
  { id: 3, name: 'Goldman Sachs', logo: 'GS', logoColor: '#0d3b6e', logoBg: '#dbeafe', industry: 'Finance / Technology', location: 'Bengaluru', hrName: 'Priya Menon', hrEmail: 'priya.menon@gs.com', hrPhone: '+91 94400 33000', pastVisits: 3, studentsHired: 9, avgPackage: '₹36 LPA', highestPackage: '₹42 LPA', lastVisit: 'Aug 2026', jobHistory: [{ year: '2026', role: 'Analyst — Technology', hired: 3, pkg: '₹42 LPA' }, { year: '2025', role: 'Analyst — Technology', hired: 3, pkg: '₹36 LPA' }, { year: '2024', role: 'Analyst — Technology', hired: 3, pkg: '₹32 LPA' }] },
  { id: 4, name: 'Flipkart', logo: 'FK', logoColor: '#0369a1', logoBg: '#e0f2fe', industry: 'E-Commerce', location: 'Bengaluru', hrName: 'Rohan Seth', hrEmail: 'rohan.seth@flipkart.com', hrPhone: '+91 97000 44000', pastVisits: 4, studentsHired: 15, avgPackage: '₹22 LPA', highestPackage: '₹28 LPA', lastVisit: 'Feb 2026', jobHistory: [{ year: '2026', role: 'SDE-I', hired: 4, pkg: '₹24 LPA' }, { year: '2025', role: 'SDE-I', hired: 5, pkg: '₹22 LPA' }, { year: '2024', role: 'SDE Intern', hired: 3, pkg: '₹80K/mo' }, { year: '2023', role: 'SDE-I', hired: 3, pkg: '₹19 LPA' }] },
  { id: 5, name: 'Qualcomm', logo: 'QC', logoColor: '#3b0764', logoBg: '#f3e8ff', industry: 'Semiconductors', location: 'Hyderabad', hrName: 'Lavanya Suresh', hrEmail: 'l.suresh@qualcomm.com', hrPhone: '+91 98001 55000', pastVisits: 3, studentsHired: 8, avgPackage: '₹26 LPA', highestPackage: '₹30 LPA', lastVisit: 'Mar 2026', jobHistory: [{ year: '2026', role: 'VLSI Engineer', hired: 3, pkg: '₹28 LPA' }, { year: '2025', role: 'VLSI Engineer', hired: 3, pkg: '₹26 LPA' }, { year: '2024', role: 'Hardware Intern', hired: 2, pkg: '₹60K/mo' }] },
  { id: 6, name: 'Deloitte India', logo: 'DE', logoColor: '#0f766e', logoBg: '#ccfbf1', industry: 'Consulting', location: 'Mumbai / Hyderabad', hrName: 'Meera Krishnan', hrEmail: 'm.krishnan@deloitte.com', hrPhone: '+91 91000 66000', pastVisits: 5, studentsHired: 22, avgPackage: '₹11 LPA', highestPackage: '₹14 LPA', lastVisit: 'Aug 2026', jobHistory: [{ year: '2026', role: 'Consultant Trainee', hired: 5, pkg: '₹11 LPA' }, { year: '2025', role: 'Consultant Trainee', hired: 5, pkg: '₹10.5 LPA' }, { year: '2024', role: 'Analyst', hired: 5, pkg: '₹10 LPA' }, { year: '2023', role: 'Analyst', hired: 4, pkg: '₹9 LPA' }, { year: '2022', role: 'Analyst', hired: 3, pkg: '₹8.5 LPA' }] },
  { id: 7, name: 'Amazon India', logo: 'AZ', logoColor: '#92400e', logoBg: '#fef3c7', industry: 'E-Commerce / Cloud', location: 'Hyderabad / Bengaluru', hrName: 'Vikram Sharma', hrEmail: 'v.sharma@amazon.com', hrPhone: '+91 99876 77000', pastVisits: 2, studentsHired: 5, avgPackage: '₹30 LPA', highestPackage: '₹34 LPA', lastVisit: 'Sep 2025', jobHistory: [{ year: '2025', role: 'SDE-I', hired: 3, pkg: '₹30 LPA' }, { year: '2024', role: 'SDE-I', hired: 2, pkg: '₹28 LPA' }] },
  { id: 8, name: 'L&T Construction', logo: 'LT', logoColor: '#1e40af', logoBg: '#dbeafe', industry: 'Infrastructure', location: 'Chennai / Mumbai', hrName: 'Suresh Nair', hrEmail: 's.nair@larsentoubro.com', hrPhone: '+91 97500 88000', pastVisits: 6, studentsHired: 24, avgPackage: '₹11 LPA', highestPackage: '₹14 LPA', lastVisit: 'Feb 2026', jobHistory: [{ year: '2026', role: 'Graduate Engineer', hired: 5, pkg: '₹12 LPA' }, { year: '2025', role: 'Graduate Engineer', hired: 5, pkg: '₹11 LPA' }, { year: '2024', role: 'Site Intern', hired: 3, pkg: '₹15K/mo' }, { year: '2023', role: 'Graduate Engineer', hired: 5, pkg: '₹10 LPA' }, { year: '2022', role: 'Graduate Engineer', hired: 4, pkg: '₹9.5 LPA' }, { year: '2021', role: 'Graduate Engineer', hired: 2, pkg: '₹9 LPA' }] },
]

// ─────────────────────────────────────────────────────────────────────────────
// Communication data
// ─────────────────────────────────────────────────────────────────────────────

type CommChannel = 'Email' | 'SMS' | 'WhatsApp' | 'In-App'
type CommStatus = 'Delivered' | 'Partial' | 'Scheduled'

interface SentMessage {
  id: number
  channel: CommChannel; audience: string; subject: string
  sentAt: string; recipients: number; status: CommStatus
}

const COMM_STATUS_STYLE: Record<CommStatus, { color: string; accent: string }> = {
  Delivered: { color: '#15803d', accent: '#22c55e' },
  Partial: { color: '#a16207', accent: '#f59e0b' },
  Scheduled: { color: '#1d4ed8', accent: '#3b82f6' },
}

const CHANNEL_STYLE: Record<CommChannel, { color: string; bg: string }> = {
  Email: { color: '#1d4ed8', bg: '#dbeafe' },
  SMS: { color: '#0f766e', bg: '#ccfbf1' },
  WhatsApp: { color: '#15803d', bg: '#dcfce7' },
  'In-App': { color: '#6b21a8', bg: '#f3e8ff' },
}

const AUDIENCE_OPTIONS = [
  { key: 'all', label: 'All Students', count: 1479 },
  { key: 'cs', label: 'CS Dept', count: 350 },
  { key: 'ec', label: 'EC Dept', count: 280 },
  { key: 'me', label: 'ME Dept', count: 220 },
  { key: 'civil', label: 'Civil Dept', count: 190 },
  { key: 'chem', label: 'Chem Dept', count: 180 },
  { key: 'batch25', label: 'Batch 2025', count: 860 },
  { key: 'batch26', label: 'Batch 2026', count: 619 },
  { key: 'eligible', label: 'Eligible Only', count: 650 },
  { key: 'shortlisted', label: 'Shortlisted', count: 89 },
  { key: 'offered', label: 'Offered', count: 42 },
]

const SENT_MESSAGES: SentMessage[] = [
  { id: 1, channel: 'Email', audience: 'All CS 2025 Batch', subject: 'Goldman Sachs Drive — Registration Open', sentAt: '05 Aug 2026, 10:00 AM', recipients: 63, status: 'Delivered' },
  { id: 2, channel: 'WhatsApp', audience: 'All Eligible Students', subject: 'Reminder: Infosys Drive Registration Closes Today', sentAt: '09 Aug 2026, 09:30 AM', recipients: 412, status: 'Delivered' },
  { id: 3, channel: 'In-App', audience: 'Shortlisted — Amazon Drive', subject: 'Interview Schedule Confirmation Required', sentAt: '03 Aug 2026, 03:00 PM', recipients: 18, status: 'Delivered' },
  { id: 4, channel: 'Email', audience: 'Electronics 2025 Batch', subject: 'Qualcomm VLSI Drive — Applications Now Open', sentAt: '01 Aug 2026, 11:00 AM', recipients: 44, status: 'Delivered' },
  { id: 5, channel: 'SMS', audience: 'All 2025 Batch', subject: 'Placement Season begins 10 Aug — keep docs ready', sentAt: '28 Jul 2026, 08:00 AM', recipients: 201, status: 'Delivered' },
  { id: 6, channel: 'Email', audience: 'Offered — Not Yet Responded', subject: 'Offer Acceptance Deadline: 20 Aug 2026', sentAt: '14 Aug 2026, 10:00 AM', recipients: 31, status: 'Scheduled' },
  { id: 7, channel: 'In-App', audience: 'All Students', subject: 'Platform Update: New Resume Submission Flow', sentAt: '20 Jul 2026, 02:00 PM', recipients: 1479, status: 'Delivered' },
  { id: 8, channel: 'WhatsApp', audience: 'Civil + Mechanical 2025', subject: 'L&T & Tata Motors drives scheduled — register now', sentAt: '10 Aug 2026, 09:00 AM', recipients: 89, status: 'Partial' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Shared typography tokens
// ─────────────────────────────────────────────────────────────────────────────

const FONT_CONDENSED = "'Barlow Condensed', sans-serif"
const FONT_DISPLAY = "'Plus Jakarta Sans', sans-serif"
const FONT_BODY = "'Inter', sans-serif"
const FONT_MONO = "'DM Mono', monospace"

// ─────────────────────────────────────────────────────────────────────────────
// App shell — sidebar + topbar + page routing
// ─────────────────────────────────────────────────────────────────────────────

function AppShell({ darkMode, setDarkMode, onLogout }: { darkMode: boolean; setDarkMode: (v: boolean) => void; onLogout: () => void }) {
  const t = useTheme()
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null)
  const [notifications, setNotifications] = useState<{ id: number; text: string; time: string; isRead: boolean }[]>([])
  const currentUser = api.getStoredUser()
  const displayName: string = currentUser?.full_name || 'User'
  const displayInitials = displayName.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase() || 'U'
  const displayRole: string = currentUser?.role
    ? currentUser.role.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
    : 'Placement Officer'

  const loadNotifications = React.useCallback(() => {
    api.communication.notifications().then(setNotifications).catch(() => setNotifications([]))
  }, [])

  useEffect(() => { loadNotifications() }, [loadNotifications])

  async function handleMarkAllRead() {
    const unread = notifications.filter(n => !n.isRead)
    if (!unread.length) return
    await Promise.all(unread.map(n => api.communication.markNotificationRead(n.id).catch(() => null)))
    loadNotifications()
  }

  async function handleMarkOneRead(id: number) {
    await api.communication.markNotificationRead(id).catch(() => null)
    loadNotifications()
  }

  const pageTitles: Record<string, { title: string; sub: string }> = {
    Dashboard: { title: 'Dashboard', sub: 'IIT Hyderabad — Placement Season 2025–26' },
    Students: { title: 'Student Management', sub: 'IIT Hyderabad — 2025 & 2026 Batches' },
    Users: { title: 'User Management', sub: 'Manage accounts and roles' },
  }
  const baseTitle = pageTitles[activeNav] ?? { title: activeNav, sub: 'IIT Hyderabad' }
  const page = selectedStudent && activeNav === 'Students'
    ? { title: selectedStudent.name, sub: `${selectedStudent.roll} · ${selectedStudent.department}` }
    : baseTitle

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f0f2f7', fontFamily: FONT_BODY }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 flex flex-col w-56 shrink-0 transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: '#0b1120' }}
      >
        {/* Wordmark */}
        <div className="flex items-center gap-3 px-5 h-16 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <img
            src={hustleGradLogo}
            alt="HustleGrad"
            style={{ width: 28, height: 28, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />
          <span style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.125rem', color: t.bg, letterSpacing: '0.02em' }}>
            HustleGrad
          </span>
          <button className="ml-auto lg:hidden text-slate-500" onClick={() => setSidebarOpen(false)}>
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 pt-5 overflow-y-auto">
          {NAV.map(({ icon: Icon, label }) => {
            const isActive = activeNav === label
            return (
              <button
                key={label}
                onClick={() => { setActiveNav(label); setSidebarOpen(false); setSelectedStudent(null) }}
                className="flex items-center gap-3 w-full py-2.5 transition-colors"
                style={{
                  paddingLeft: '18px',
                  paddingRight: '16px',
                  borderLeft: isActive ? '2px solid #6366f1' : '2px solid transparent',
                  background: 'transparent',
                }}
              >
                <Icon
                  size={14}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  style={{ color: isActive ? '#818cf8' : '#374151', flexShrink: 0 }}
                />
                <span style={{
                  fontFamily: FONT_BODY,
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? t.border : '#4b5563',
                  letterSpacing: '0.01em',
                }}>
                  {label}
                </span>
              </button>
            )
          })}

          {currentUser?.role === 'placement_officer' && (
            <button
              onClick={() => { setActiveNav('Users'); setSidebarOpen(false); setSelectedStudent(null) }}
              className="flex items-center gap-3 w-full py-2.5 transition-colors"
              style={{
                paddingLeft: '18px',
                paddingRight: '16px',
                borderLeft: activeNav === 'Users' ? '2px solid #6366f1' : '2px solid transparent',
                background: 'transparent',
              }}
            >
              <ShieldCheck size={14} strokeWidth={activeNav === 'Users' ? 2.2 : 1.8} style={{ color: activeNav === 'Users' ? '#818cf8' : '#374151', flexShrink: 0 }} />
              <span style={{ fontFamily: FONT_BODY, fontSize: '0.8125rem', fontWeight: activeNav === 'Users' ? 500 : 400, color: activeNav === 'Users' ? t.border : '#4b5563', letterSpacing: '0.01em' }}>
                User Management
              </span>
            </button>
          )}

          <div className="mt-4 mx-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />

          <button
            onClick={() => setActiveNav('Settings')}
            className="flex items-center gap-3 w-full py-2.5 mt-1 transition-colors"
            style={{
              paddingLeft: '18px',
              paddingRight: '16px',
              borderLeft: activeNav === 'Settings' ? '2px solid #6366f1' : '2px solid transparent',
            }}
          >
            <Settings size={14} strokeWidth={1.8} style={{ color: '#374151', flexShrink: 0 }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: '0.8125rem', color: '#4b5563' }}>Settings</span>
          </button>
        </nav>

        {/* User strip */}
        <div className="px-5 pb-5 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0" style={{ background: t.accent, fontFamily: FONT_DISPLAY }}>{displayInitials}</div>
            <div className="min-w-0">
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: '0.75rem', color: t.border }}>{displayName}</div>
              <div style={{ fontSize: '0.7rem', color: '#4b5563' }}>{displayRole}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-16 shrink-0 flex items-center gap-4 px-5 lg:px-7" style={{ background: t.bg, borderBottom: '1px solid #e9ecef' }}>
          <button className="lg:hidden shrink-0 text-slate-500" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="hidden sm:block">
            <h1 style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.125rem', color: t.text, letterSpacing: '0.01em', lineHeight: 1 }}>{page.title}</h1>
            <p className="text-xs mt-0.5" style={{ color: t.textMuted, fontFamily: FONT_BODY }}>{page.sub}</p>
          </div>

          <div className="flex-1 max-w-xs ml-auto sm:ml-4 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
            <input
              type="text"
              placeholder="Search students, companies…"
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg outline-none"
              style={{ background: '#f8fafc', border: '1px solid t.border', color: t.text }}
            />
          </div>

          {/* Bell */}
          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'transparent', border: '1px solid t.border' }}
          >
            {darkMode ? <Sun size={16} style={{ color: t.textMuted }} /> : <Moon size={16} style={{ color: t.textMuted }} />}
          </button>
          <div className="relative shrink-0">
            <button
              onClick={() => { setNotifOpen(v => !v); setProfileOpen(false) }}
              className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: notifOpen ? t.bgAlt : 'transparent', border: '1px solid t.border' }}
            ><Bell
                size={16} style={{ color: t.textMuted }} />
              {notifications.some(n => !n.isRead) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#ef4444', border: '1.5px solid t.bg' }} />
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-11 w-72 rounded-xl shadow-xl z-50 overflow-hidden" style={{ background: t.bg, border: '1px solid t.border' }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid t.bgAlt' }}>
                  <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: '0.75rem', color: t.text }}>Notifications</span>
                  <button onClick={handleMarkAllRead} className="text-xs font-medium" style={{ color: t.accent }}>Mark all read</button>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs" style={{ color: t.textMuted }}>No notifications yet.</p>
                  </div>
                ) : notifications.map((n, i) => (
                  <div key={n.id} onClick={() => !n.isRead && handleMarkOneRead(n.id)} className="px-4 py-3 flex gap-3 items-start hover:bg-slate-50 cursor-pointer" style={{ borderBottom: i < notifications.length - 1 ? '1px solid #f8fafc' : 'none', opacity: n.isRead ? 0.6 : 1 }}>
                    <div className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ background: n.isRead ? t.textMuted : t.accent }} />
                    <div>
                      <p className="text-xs leading-snug" style={{ color: t.text }}>{n.text}</p>
                      <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative shrink-0">
            <button
              onClick={() => { setProfileOpen(v => !v); setNotifOpen(false) }}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
              style={{ border: '1px solid t.border', background: profileOpen ? t.bgAlt : t.bg }}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ background: t.accent }}>{displayInitials}</div>
              <span className="hidden sm:block text-xs font-medium" style={{ color: t.text, fontFamily: FONT_DISPLAY }}>{displayName}</span>
              <ChevronDown size={12} style={{ color: t.textMuted }} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-11 w-48 rounded-xl shadow-xl z-50 overflow-hidden" style={{ background: t.bg, border: '1px solid t.border' }}>
                {['Profile', 'Account Settings', 'Help & Support', 'Sign Out'].map((item, i, arr) => (
                  <button
                    key={item}
                    onClick={item === 'Sign Out' ? onLogout : undefined}
                    className="w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-slate-50"
                    style={{ color: item === 'Sign Out' ? '#ef4444' : t.text, borderBottom: i < arr.length - 1 ? '1px solid #f8fafc' : 'none' }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {activeNav === 'Dashboard' && <DashboardPage />}
          {activeNav === 'Students' && !selectedStudent && (
            <StudentsPage globalSearch={globalSearch} onSelectStudent={setSelectedStudent} />
          )}
          {activeNav === 'Students' && selectedStudent && (
            <StudentProfilePage student={selectedStudent} onBack={() => setSelectedStudent(null)} />
          )}
          {activeNav === 'Placements' && <PlacementsPage />}
          {activeNav === 'Internships' && <InternshipsPage />}
          {activeNav === 'Drives' && <DrivesPage />}
          {activeNav === 'Companies' && <CompaniesPage />}
          {activeNav === 'Communication' && <CommunicationPage />}
          {activeNav === 'Users' && <UsersPage />}
          {activeNav !== 'Dashboard' && activeNav !== 'Students' && activeNav !== 'Placements' && activeNav !== 'Internships' && activeNav !== 'Drives' && activeNav !== 'Companies' && activeNav !== 'Communication' && activeNav !== 'Users' && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm" style={{ color: t.textMuted }}>{activeNav} — coming soon</p>
            </div>
          )}
        </main>
      </div>

      {(notifOpen || profileOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setNotifOpen(false); setProfileOpen(false) }} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard page
// ─────────────────────────────────────────────────────────────────────────────

function DashboardPage() {
  const t = useTheme()
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const [dashboard, setDashboard] = useState<{
    kpis: { label: string; value: string; delta: string; up: boolean; sub: string }[]
    chart: { month: string; placed: number }[]
    drives: { company: string; role: string; date: string; status: string; logo: string; logoColor: string; logoBg: string }[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.dashboard.get()
      .then(d => { if (!cancelled) { setDashboard(d); setLoading(false) } })
      .catch(e => { if (!cancelled) { setError(e instanceof Error ? e.message : 'Failed to load dashboard'); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return <div className="px-5 lg:px-7 py-6"><p className="text-sm" style={{ color: t.textMuted }}>Loading dashboard…</p></div>
  }
  if (error || !dashboard) {
    return <div className="px-5 lg:px-7 py-6"><p className="text-sm" style={{ color: '#ef4444' }}>Couldn't load the dashboard{error ? `: ${error}` : ''}.</p></div>
  }
  const { kpis, chart, drives } = dashboard

  return (
    <div className="px-5 lg:px-7 py-6">

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpis.map(k => (
          <div key={k.label} className="rounded-xl p-5 flex flex-col gap-3" style={{ background: t.bg, border: '1px solid #e9ecef' }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: '0.7rem', color: t.textMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{k.label}</span>
            <div>
              <div style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '2rem', color: t.text, letterSpacing: '-0.01em', lineHeight: 1 }}>{k.value}</div>
              <div className="flex items-center gap-1.5 mt-2">
                {k.up ? <TrendingUp size={12} style={{ color: '#10b981' }} /> : <TrendingDown size={12} style={{ color: '#ef4444' }} />}
                <span className="text-xs font-medium" style={{ color: k.up ? '#10b981' : '#ef4444' }}>{k.delta}</span>
                <span className="text-xs" style={{ color: t.textMuted }}>{k.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Drives table */}
      <div className="rounded-xl overflow-hidden mb-4" style={{ background: t.bg, border: '1px solid #e9ecef' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid t.bgAlt' }}>
          <div>
            <h2 style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.125rem', color: t.text, letterSpacing: '0.01em' }}>Upcoming Placement Drives</h2>
            <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>Next 30 days · {drives.length} drives scheduled</p>
          </div>
          <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors" style={{ color: t.accent, border: '1px solid #e0e5ff' }}>
            View all <ArrowRight size={12} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                {['Company', 'Position', 'Drive Date', 'Status'].map(h => (
                  <th key={h} className="text-left px-5 py-3" style={{ fontSize: '0.68rem', fontWeight: 600, color: t.textMuted, fontFamily: FONT_BODY, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drives.map((d, i) => {
                const s = DRIVE_STATUS[d.status] ?? { color: '#475569', accent: '#94a3b8' }
                return (
                  <tr key={i} className="transition-colors hover:bg-slate-50 cursor-pointer" style={{ borderBottom: i < drives.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0" style={{ background: d.logoBg, color: d.logoColor, fontFamily: FONT_DISPLAY }}>{d.logo}</div>
                        <span className="text-sm font-medium" style={{ color: t.text, fontFamily: FONT_DISPLAY }}>{d.company}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><span className="text-xs" style={{ color: t.textMuted }}>{d.role}</span></td>
                    <td className="px-5 py-3.5"><span className="text-xs font-medium" style={{ color: t.text, fontFamily: FONT_MONO }}>{d.date}</span></td>
                    <td className="px-5 py-3.5">
                      <span style={{
                        display: 'inline-block',
                        borderLeft: `2px solid ${s.accent}`,
                        paddingLeft: '8px',
                        color: s.color,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        fontFamily: FONT_BODY,
                      }}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bar chart */}
      <div className="rounded-xl p-6 mb-4" style={{ background: t.bg, border: '1px solid #e9ecef' }}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.125rem', color: t.text, letterSpacing: '0.01em' }}>Monthly Placement Trends</h2>
            <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>Offers accepted per month · Academic Year 2025–26</p>
          </div>
          <div className="flex gap-6">
            <div className="text-right">
              <div style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.5rem', color: t.text }}>1,247</div>
              <div className="text-xs" style={{ color: t.textMuted }}>Total placed</div>
            </div>
            <div className="text-right">
              <div style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.5rem', color: '#10b981' }}>+183</div>
              <div className="text-xs" style={{ color: t.textMuted }}>YoY change</div>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chart} barSize={32} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="t.bgAlt" strokeDasharray="0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.textMuted, fontFamily: FONT_BODY }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: t.textMuted, fontFamily: FONT_BODY }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: '#f8fafc', radius: 4 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="rounded-lg px-3 py-2 text-xs shadow-lg" style={{ background: t.text, color: t.bg }}>
                    <div className="font-semibold" style={{ fontFamily: FONT_DISPLAY }}>{label} 2025–26</div>
                    <div className="mt-0.5" style={{ color: '#a5b4fc' }}>{payload[0].value} students placed</div>
                  </div>
                )
              }}
            />
            <Bar dataKey="placed" radius={[4, 4, 0, 0]} onMouseEnter={(_, i) => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)}>
              {chart.map((_, i) => (
                <Cell key={i} fill={hoveredBar === i ? t.accent : '#c7d2fe'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#c7d2fe' }} />
          <span className="text-xs" style={{ color: t.textMuted }}>Placements confirmed · hover a bar for details</span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Drives This Month', value: '12', note: '3 pending confirmation' },
          { label: 'Offers Extended', value: '374', note: 'This month' },
          { label: 'Avg. CGPA (Placed)', value: '7.9', note: 'Among placed students' },
          { label: 'Highest Package', value: '₹42 LPA', note: 'Goldman Sachs, Finance' },
        ].map(s => (
          <div key={s.label} className="rounded-xl px-4 py-4" style={{ background: t.bg, border: '1px solid #e9ecef' }}>
            <div style={{ fontSize: '0.68rem', color: t.textMuted, letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: FONT_BODY }}>{s.label}</div>
            <div style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.5rem', color: t.text, marginTop: '6px' }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: '#cbd5e1' }}>{s.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Students page
// ─────────────────────────────────────────────────────────────────────────────

type SortKey = 'name' | 'roll' | 'cgpa' | 'status'
type SortDir = 'asc' | 'desc'

function StudentsPage({ globalSearch, onSelectStudent }: { globalSearch: string; onSelectStudent: (s: StudentSummary) => void }) {
  const t = useTheme()
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('All Departments')
  const [batchFilter, setBatchFilter] = useState('All Batches')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [showAddModal, setShowAddModal] = useState(false)
  const [students, setStudents] = useState<StudentListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadStudents = React.useCallback(() => {
    setLoading(true)
    api.students.list()
      .then(list => { setStudents(list); setLoading(false) })
      .catch(e => { setLoadError(e instanceof Error ? e.message : 'Failed to load students'); setLoading(false) })
  }, [])

  useEffect(() => { loadStudents() }, [loadStudents])

  const query = search || globalSearch

  const filtered = useMemo(() => {
    let rows = students.slice()
    if (query) rows = rows.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.roll.toLowerCase().includes(query.toLowerCase()))
    if (deptFilter !== 'All Departments') rows = rows.filter(s => s.department === deptFilter)
    if (batchFilter !== 'All Batches') rows = rows.filter(s => s.batch === batchFilter)
    if (statusFilter !== 'All Statuses') rows = rows.filter(s => s.status === statusFilter)

    rows.sort((a, b) => {
      let av: string | number = a[sortKey]
      let bv: string | number = b[sortKey]
      if (sortKey === 'cgpa') { av = a.cgpa; bv = b.cgpa }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
    return rows
  }, [students, query, deptFilter, batchFilter, statusFilter, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    const t = useTheme()
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown size={11} style={{ color: '#cbd5e1', marginLeft: 3 }} />
    return sortDir === 'asc'
      ? <ChevronUp size={11} style={{ color: t.accent, marginLeft: 3 }} />
      : <ChevronDown size={11} style={{ color: t.accent, marginLeft: 3 }} />
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    students.forEach(s => { c[s.status] = (c[s.status] ?? 0) + 1 })
    return c
  }, [students])

  return (
    <div className="px-5 lg:px-7 py-6">

      {/* Status filter strip */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(['Placed', 'Offered', 'Interviewing', 'Applied', 'Eligible'] as PlacementStatus[]).map(st => {
          const s = PLACEMENT_STATUS_STYLE[st]
          const isActive = statusFilter === st
          return (
            <button
              key={st}
              onClick={() => setStatusFilter(isActive ? 'All Statuses' : st)}
              className="flex items-center gap-2 py-1.5 text-xs font-medium transition-all"
              style={{
                paddingLeft: '12px',
                paddingRight: '12px',
                background: isActive ? s.bg : t.bg,
                color: isActive ? s.color : t.textMuted,
                border: `1px solid ${isActive ? s.accent + '55' : '#e9ecef'}`,
                borderLeft: isActive ? `3px solid ${s.accent}` : `3px solid transparent`,
                borderRadius: '6px',
                fontFamily: FONT_BODY,
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {st}
              <span style={{ background: 'rgba(0,0,0,0.08)', borderRadius: '999px', padding: '1px 6px', fontSize: '0.7rem' }}>{counts[st] ?? 0}</span>
            </button>
          )
        })}
      </div>

      {/* Filter bar */}
      <div className="rounded-xl px-5 py-3.5 mb-4 flex flex-wrap gap-3 items-center" style={{ background: t.bg, border: '1px solid #e9ecef' }}>
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
          <input
            type="text"
            placeholder="Search by name or roll number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg outline-none"
            style={{ background: '#f8fafc', border: '1px solid t.border', color: t.text }}
          />
        </div>

        <div className="flex items-center gap-2 text-xs" style={{ color: t.textMuted }}>
          <Filter size={12} />
          <span className="font-medium" style={{ color: t.textMuted, fontFamily: FONT_DISPLAY }}>Filter:</span>
        </div>

        <FilterSelect value={deptFilter} onChange={setDeptFilter} options={DEPARTMENTS} />
        <FilterSelect value={batchFilter} onChange={setBatchFilter} options={BATCHES} />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={STATUSES} />

        {(deptFilter !== 'All Departments' || batchFilter !== 'All Batches' || statusFilter !== 'All Statuses' || search) && (
          <button
            onClick={() => { setDeptFilter('All Departments'); setBatchFilter('All Batches'); setStatusFilter('All Statuses'); setSearch('') }}
            className="text-xs font-medium px-3 py-2 rounded-lg transition-colors hover:bg-slate-50"
            style={{ color: '#ef4444', border: '1px solid #fee2e2' }}
          >
            Clear all
          </button>
        )}

        <div className="ml-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all hover:opacity-90"
            style={{ background: '#0b1120', color: t.bg, fontFamily: FONT_DISPLAY }}
          >
            <Plus size={13} />
            Add Student
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: t.bg, border: '1px solid #e9ecef' }}>
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid t.bgAlt' }}>
          <p className="text-xs" style={{ color: t.textMuted }}>
            Showing <span style={{ color: t.text, fontWeight: 600 }}>{filtered.length}</span> of {students.length} students
          </p>
          <p className="text-xs" style={{ color: t.textMuted }}>Click column headers to sort</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid t.bgAlt', background: '#fafafa' }}>
                <th className="text-left px-5 py-3 w-10" style={{ fontSize: '0.68rem', fontWeight: 600, color: t.textMuted, fontFamily: FONT_BODY, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Photo</th>
                <th className="text-left px-4 py-3 cursor-pointer select-none" style={{ fontSize: '0.68rem', fontWeight: 600, color: t.textMuted, fontFamily: FONT_BODY, letterSpacing: '0.05em', textTransform: 'uppercase' }} onClick={() => toggleSort('name')}>
                  <span className="inline-flex items-center">Name <SortIcon col="name" /></span>
                </th>
                <th className="text-left px-4 py-3 cursor-pointer select-none" style={{ fontSize: '0.68rem', fontWeight: 600, color: t.textMuted, fontFamily: FONT_BODY, letterSpacing: '0.05em', textTransform: 'uppercase' }} onClick={() => toggleSort('roll')}>
                  <span className="inline-flex items-center">Roll No. <SortIcon col="roll" /></span>
                </th>
                <th className="text-left px-4 py-3" style={{ fontSize: '0.68rem', fontWeight: 600, color: t.textMuted, fontFamily: FONT_BODY, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Department</th>
                <th className="text-left px-4 py-3 cursor-pointer select-none" style={{ fontSize: '0.68rem', fontWeight: 600, color: t.textMuted, fontFamily: FONT_BODY, letterSpacing: '0.05em', textTransform: 'uppercase' }} onClick={() => toggleSort('cgpa')}>
                  <span className="inline-flex items-center">CGPA <SortIcon col="cgpa" /></span>
                </th>
                <th className="text-left px-4 py-3 cursor-pointer select-none" style={{ fontSize: '0.68rem', fontWeight: 600, color: t.textMuted, fontFamily: FONT_BODY, letterSpacing: '0.05em', textTransform: 'uppercase' }} onClick={() => toggleSort('status')}>
                  <span className="inline-flex items-center">Status <SortIcon col="status" /></span>
                </th>
                <th className="text-left px-4 py-3" style={{ fontSize: '0.68rem', fontWeight: 600, color: t.textMuted, fontFamily: FONT_BODY, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Resume</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <p className="text-sm" style={{ color: t.textMuted }}>Loading students…</p>
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <p className="text-sm font-medium" style={{ color: '#ef4444' }}>Couldn't load students: {loadError}</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <p className="text-sm font-medium" style={{ color: t.textMuted }}>No students match your filters.</p>
                    <p className="text-xs mt-1" style={{ color: '#cbd5e1' }}>Try adjusting your search or filter criteria.</p>
                  </td>
                </tr>
              ) : filtered.map((s, i) => {
                const st = PLACEMENT_STATUS_STYLE[s.status]
                return (
                  <tr
                    key={s.id}
                    onClick={() => onSelectStudent(s)}
                    className="transition-colors hover:bg-slate-50 cursor-pointer"
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none' }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: s.avatarBg, color: s.avatarColor, fontFamily: FONT_DISPLAY }}>
                        {s.initials}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 min-w-[160px]">
                      <div className="text-sm font-semibold" style={{ color: t.text, fontFamily: FONT_DISPLAY }}>{s.name}</div>
                      {s.company && <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>{s.company}</div>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-medium" style={{ color: '#475569', fontFamily: FONT_MONO, letterSpacing: '0.02em' }}>{s.roll}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs" style={{ color: t.textMuted }}>{s.department}</span>
                      <span className="ml-2 text-xs" style={{ color: '#cbd5e1' }}>'{s.batch.slice(2)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ fontFamily: FONT_DISPLAY, color: s.cgpa >= 9 ? '#15803d' : s.cgpa >= 8 ? t.text : t.textMuted }}>
                          {s.cgpa.toFixed(1)}
                        </span>
                        <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: t.bgAlt }}>
                          <div className="h-full rounded-full" style={{ width: `${(s.cgpa / 10) * 100}%`, background: s.cgpa >= 9 ? '#22c55e' : s.cgpa >= 8 ? t.accent : t.textMuted }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span style={{
                        display: 'inline-block',
                        borderLeft: `2px solid ${st.accent}`,
                        paddingLeft: '8px',
                        color: st.color,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        fontFamily: FONT_BODY,
                      }}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <a
                        href={s.resumeUrl}
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-indigo-50"
                        style={{ color: t.accent, border: '1px solid #e0e5ff' }}
                      >
                        View <ExternalLink size={10} />
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && <AddStudentModal onClose={() => setShowAddModal(false)} onCreated={loadStudents} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Student Profile page
// ─────────────────────────────────────────────────────────────────────────────

type ProfileTab = 'overview' | 'academic' | 'placement'

const APP_STAGE_STYLE: Record<Application['stage'], { color: string; accent: string }> = {
  Applied: { color: '#475569', accent: '#64748b' },
  Shortlisted: { color: '#1d4ed8', accent: '#3b82f6' },
  'Written Test': { color: '#a16207', accent: '#eab308' },
  'Technical Interview': { color: '#c2410c', accent: '#f97316' },
  'HR Round': { color: '#6b21a8', accent: '#a855f7' },
  Offered: { color: '#15803d', accent: '#22c55e' },
  Rejected: { color: '#b91c1c', accent: '#ef4444' },
}

const SECTION_LABEL: React.CSSProperties = {
  fontSize: '0.65rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#64748b',
  fontFamily: "'Inter', sans-serif",
  marginBottom: '12px',
  display: 'block',
}

function AddCertificationForm({ studentId, onAdded }: { studentId: number; onAdded: () => void }) {
  const t = useTheme()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [issuer, setIssuer] = useState('')
  const [year, setYear] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd() {
    if (!name.trim()) { setError('Certification name is required.'); return }
    setError('')
    setSaving(true)
    try {
      await api.students.addCertification(studentId, { name: name.trim(), issuer: issuer || undefined, year: year ? Number(year) : undefined })
      setName(''); setIssuer(''); setYear(''); setOpen(false)
      onAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add certification')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-medium mt-3" style={{ color: t.accent }}>
        + Add certification
      </button>
    )
  }

  return (
    <div className="mt-3 p-3 rounded-lg flex flex-col gap-2" style={{ background: t.bgAlt }}>
      <div className="grid grid-cols-2 gap-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Certification name" className="px-3 py-2 text-xs rounded-lg outline-none" style={{ background: t.bg, border: '1px solid #e2e8f0', color: t.text }} />
        <input value={issuer} onChange={e => setIssuer(e.target.value)} placeholder="Issuer" className="px-3 py-2 text-xs rounded-lg outline-none" style={{ background: t.bg, border: '1px solid #e2e8f0', color: t.text }} />
      </div>
      <input value={year} onChange={e => setYear(e.target.value)} type="number" placeholder="Year, e.g. 2025" className="px-3 py-2 text-xs rounded-lg outline-none w-32" style={{ background: t.bg, border: '1px solid #e2e8f0', color: t.text }} />
      {error && <p style={{ color: '#dc2626', fontSize: '0.72rem', margin: 0 }}>{error}</p>}
      <div className="flex gap-2">
        <button onClick={handleAdd} disabled={saving} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: '#0b1120', color: t.bg, opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : 'Save'}</button>
        <button onClick={() => { setOpen(false); setError('') }} className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ color: t.textMuted }}>Cancel</button>
      </div>
    </div>
  )
}

function AddSemesterRecordForm({ studentId, onAdded }: { studentId: number; onAdded: () => void }) {
  const t = useTheme()
  const [open, setOpen] = useState(false)
  const [sem, setSem] = useState('')
  const [gpa, setGpa] = useState('')
  const [backlogs, setBacklogs] = useState('0')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd() {
    if (!sem || !gpa) { setError('Semester and GPA are required.'); return }
    setError('')
    setSaving(true)
    try {
      await api.students.addSemesterRecord(studentId, { sem: Number(sem), gpa: Number(gpa), backlogs: backlogs ? Number(backlogs) : 0 })
      setSem(''); setGpa(''); setBacklogs('0'); setOpen(false)
      onAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add semester record')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <div className="px-5 py-3">
        <button onClick={() => setOpen(true)} className="text-xs font-medium" style={{ color: t.accent }}>+ Add semester record</button>
      </div>
    )
  }

  return (
    <div className="px-5 py-4 flex flex-col gap-2" style={{ borderTop: '1px solid #f8fafc' }}>
      <div className="grid grid-cols-3 gap-2">
        <input value={sem} onChange={e => setSem(e.target.value)} type="number" placeholder="Semester" className="px-3 py-2 text-xs rounded-lg outline-none" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: t.text }} />
        <input value={gpa} onChange={e => setGpa(e.target.value)} type="number" step="0.01" placeholder="GPA" className="px-3 py-2 text-xs rounded-lg outline-none" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: t.text }} />
        <input value={backlogs} onChange={e => setBacklogs(e.target.value)} type="number" placeholder="Backlogs" className="px-3 py-2 text-xs rounded-lg outline-none" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: t.text }} />
      </div>
      {error && <p style={{ color: '#dc2626', fontSize: '0.72rem', margin: 0 }}>{error}</p>}
      <div className="flex gap-2">
        <button onClick={handleAdd} disabled={saving} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: '#0b1120', color: t.bg, opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : 'Save'}</button>
        <button onClick={() => { setOpen(false); setError('') }} className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ color: t.textMuted }}>Cancel</button>
      </div>
    </div>
  )
}

function StudentProfilePage({ student: summary, onBack }: { student: StudentSummary; onBack: () => void }) {
  const t = useTheme()
  const [tab, setTab] = useState<ProfileTab>('overview')
  const [editMode, setEditMode] = useState(false)
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStudent = React.useCallback(() => {
    setLoading(true)
    setError('')
    api.students.get(summary.id)
      .then(full => { setStudent(full); setLoading(false) })
      .catch(e => { setError(e instanceof Error ? e.message : 'Failed to load student'); setLoading(false) })
  }, [summary.id])

  useEffect(() => { loadStudent() }, [loadStudent])

  if (loading) {
    return <div className="px-5 lg:px-7 py-6"><p className="text-sm" style={{ color: t.textMuted }}>Loading {summary.name}…</p></div>
  }
  if (error || !student) {
    return (
      <div className="px-5 lg:px-7 py-6">
        <button onClick={onBack} className="text-xs font-medium mb-4" style={{ color: t.accent }}>← Back to Student Management</button>
        <p className="text-sm font-medium" style={{ color: '#ef4444' }}>Couldn't load this student{error ? `: ${error}` : ''}.</p>
      </div>
    )
  }

  const s = student
  const st = PLACEMENT_STATUS_STYLE[s.status]

  return (
    <div className="px-5 lg:px-7 py-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-70" style={{ color: t.accent }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Student Management
        </button>
        <span style={{ color: '#cbd5e1' }}>/</span>
        <span className="text-xs" style={{ color: t.textMuted }}>{s.name}</span>
      </div>

      <div className="flex flex-col xl:flex-row gap-5">

        {/* ── Left column — single card with sections ── */}
        <div className="xl:w-64 shrink-0">
          <div className="rounded-xl overflow-hidden" style={{ background: t.bg, border: '1px solid #e9ecef' }}>

            {/* Identity */}
            <div className="px-6 py-6 flex flex-col items-center text-center" style={{ borderBottom: '1px solid t.bgAlt' }}>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4" style={{ background: s.avatarBg, color: s.avatarColor, fontFamily: FONT_DISPLAY }}>
                {s.initials}
              </div>
              <h2 style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.25rem', color: t.text, letterSpacing: '0.01em', lineHeight: 1.2 }}>{s.name}</h2>
              <p className="text-xs mt-1" style={{ color: t.textMuted }}>{s.department}</p>
              <span style={{
                display: 'inline-block',
                marginTop: '12px',
                borderLeft: `2px solid ${st.accent}`,
                paddingLeft: '8px',
                color: st.color,
                fontWeight: 700,
                fontSize: '0.8rem',
              }}>
                {s.status}{s.company && ` · ${s.company}`}
              </span>
            </div>

            {/* Details */}
            <div className="px-5 py-4" style={{ borderBottom: '1px solid t.bgAlt' }}>
              <span style={SECTION_LABEL}>Details</span>
              {[
                { label: 'Roll No.', value: s.roll, mono: true },
                { label: 'Semester', value: `Semester ${s.semester}` },
                { label: 'Batch', value: `Class of ${s.batch}` },
                { label: 'CGPA', value: s.cgpa.toFixed(1) },
                { label: 'Grad. Year', value: String(s.graduationYear) },
                { label: 'Backlogs', value: s.totalBacklogs === 0 ? 'None' : String(s.totalBacklogs) },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #f8fafc' }}>
                  <span className="text-xs" style={{ color: t.textMuted }}>{row.label}</span>
                  <span className="text-xs font-medium" style={{ color: t.text, fontFamily: row.mono ? FONT_MONO : FONT_DISPLAY, letterSpacing: row.mono ? '0.02em' : undefined }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div className="px-5 py-4" style={{ borderBottom: '1px solid t.bgAlt' }}>
              <span style={SECTION_LABEL}>Contact</span>
              {[
                { icon: '✉', value: s.email },
                { icon: '☏', value: s.phone },
                { icon: '⌂', value: s.hometown },
              ].map(c => (
                <div key={c.icon} className="flex items-start gap-2 mb-2 last:mb-0">
                  <span className="text-xs mt-0.5 shrink-0" style={{ color: t.textMuted }}>{c.icon}</span>
                  <span className="text-xs break-all leading-snug" style={{ color: t.text }}>{c.value}</span>
                </div>
              ))}
            </div>

            {/* Edit button */}
            <div className="px-5 py-4">
              <button
                onClick={() => setEditMode(v => !v)}
                className="w-full py-2.5 text-xs font-semibold rounded-lg transition-all hover:opacity-90"
                style={{ background: editMode ? t.text : '#0b1120', color: t.bg, fontFamily: FONT_DISPLAY }}
              >
                {editMode ? 'Cancel Editing' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 min-w-0">

          {/* Underline tab bar */}
          <div className="flex gap-6 mb-5" style={{ borderBottom: '2px solid t.bgAlt' }}>
            {([
              { key: 'overview', label: 'Overview' },
              { key: 'academic', label: 'Academic' },
              { key: 'placement', label: 'Placement Status' },
            ] as { key: ProfileTab; label: string }[]).map(tabItem => (
              <button
                key={tabItem.key}
                onClick={() => setTab(tabItem.key)}
                className="pb-3 text-xs transition-all"
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontWeight: tab === tabItem.key ? 600 : 400,
                  color: tab === tabItem.key ? t.text : t.textMuted,
                  borderBottom: tab === tabItem.key ? `2px solid ${t.accent}` : '2px solid transparent',
                  marginBottom: '-2px',
                }}
              >

                {tabItem.label}
              </button>
            ))}
          </div>

          {/* ── Overview tab — flat card with section dividers ── */}
          {tab === 'overview' && (
            <div className="rounded-xl overflow-hidden" style={{ background: t.bg, border: '1px solid #e9ecef' }}>

              {/* Bio */}
              <div className="px-5 py-5" style={{ borderBottom: '1px solid t.bgAlt' }}>
                <span style={SECTION_LABEL}>About</span>
                <p className="text-sm leading-relaxed" style={{ color: t.text }}>{s.bio}</p>
              </div>

              {/* Skills */}
              <div className="px-5 py-5" style={{ borderBottom: '1px solid t.bgAlt' }}>
                <span style={SECTION_LABEL}>Skills</span>
                <div className="flex flex-wrap gap-2">
                  {s.skills.map(sk => (
                    <span key={sk} className="px-3 py-1.5 rounded-md text-xs font-medium" style={{ background: t.bgAlt, color: t.text, fontFamily: FONT_DISPLAY }}>{sk}</span>
                  ))}
                  {s.skills.length === 0 && <span className="text-xs" style={{ color: t.textMuted }}>No skills listed.</span>}
                </div>
              </div>

              {/* Certifications */}
              <div className="px-5 py-5" style={{ borderBottom: '1px solid t.bgAlt' }}>
                <span style={SECTION_LABEL}>Certifications</span>
                {s.certifications.length === 0
                  ? <p className="text-xs" style={{ color: t.textMuted }}>No certifications recorded.</p>
                  : s.certifications.map((c, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5" style={{ borderBottom: i < s.certifications.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: t.text, fontFamily: FONT_DISPLAY }}>{c.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>{c.issuer}</p>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded-md" style={{ background: t.bgAlt, color: '#475569' }}>{c.year}</span>
                    </div>
                  ))}
                <AddCertificationForm studentId={s.id} onAdded={loadStudent} />
              </div>

              {/* Links */}
              <div className="px-5 py-5">
                <span style={SECTION_LABEL}>Links & Portfolio</span>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Resume', href: s.resumeUrl, icon: '📄', always: true },
                    { label: 'GitHub', href: s.github ? `https://${s.github}` : '', icon: '⌥' },
                    { label: 'LinkedIn', href: s.linkedin ? `https://${s.linkedin}` : '', icon: '💼' },
                    { label: 'Portfolio', href: s.portfolio ? `https://${s.portfolio}` : '', icon: '🔗' },
                  ].filter(l => l.always || l.href).map(l => (
                    <a
                      key={l.label}
                      href={l.href || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-slate-50"
                      style={{ border: '1px solid t.bgAlt' }}
                    >
                      <span className="text-sm">{l.icon}</span>
                      <span className="text-xs font-medium" style={{ color: t.text, fontFamily: FONT_DISPLAY }}>{l.label}</span>
                      <span className="ml-auto text-xs truncate max-w-[180px]" style={{ color: t.textMuted }}>
                        {l.href && l.href !== '#' ? l.href.replace('https://', '') : 'view'}
                      </span>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="t.textMuted" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Academic tab ── */}
          {tab === 'academic' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Cumulative CGPA', value: s.cgpa.toFixed(2) },
                  { label: 'Graduation Year', value: String(s.graduationYear) },
                  { label: 'Active Backlogs', value: s.totalBacklogs === 0 ? 'Clear' : String(s.totalBacklogs) },
                ].map(m => (
                  <div key={m.label} className="rounded-xl px-5 py-4" style={{ background: t.bg, border: '1px solid #e9ecef' }}>
                    <p style={{ fontSize: '0.68rem', color: t.textMuted, letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: FONT_BODY }}>{m.label}</p>
                    <p style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.75rem', color: t.text, marginTop: '4px' }}>{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl overflow-hidden" style={{ background: t.bg, border: '1px solid #e9ecef' }}>
                <div className="px-5 py-4" style={{ borderBottom: '1px solid t.bgAlt' }}>
                  <h3 style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1rem', color: t.text }}>Semester-wise Performance</h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr style={{ background: '#fafafa', borderBottom: '1px solid t.bgAlt' }}>
                      {['Semester', 'GPA', 'Backlogs', 'Progress'].map(h => (
                        <th key={h} className="text-left px-5 py-3" style={{ fontSize: '0.68rem', fontWeight: 600, color: t.textMuted, fontFamily: FONT_BODY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.semRecords.map((r, i) => (
                      <tr key={r.sem} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: i < s.semRecords.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-semibold" style={{ fontFamily: FONT_DISPLAY, color: t.text }}>Semester {r.sem}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.1rem', color: r.gpa >= 9 ? '#15803d' : r.gpa >= 8 ? '#1d4ed8' : '#475569' }}>{r.gpa.toFixed(1)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          {r.backlogs === 0
                            ? <span style={{ borderLeft: '2px solid #22c55e', paddingLeft: '8px', color: '#15803d', fontWeight: 600, fontSize: '0.75rem' }}>Clear</span>
                            : <span style={{ borderLeft: '2px solid #ef4444', paddingLeft: '8px', color: '#b91c1c', fontWeight: 600, fontSize: '0.75rem' }}>{r.backlogs} backlog{r.backlogs > 1 ? 's' : ''}</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1 rounded-full overflow-hidden" style={{ background: t.bgAlt }}>
                              <div className="h-full rounded-full" style={{ width: `${(r.gpa / 10) * 100}%`, background: r.gpa >= 9 ? '#22c55e' : r.gpa >= 8 ? t.accent : t.textMuted }} />
                            </div>
                            <span className="text-xs" style={{ color: t.textMuted }}>{(r.gpa / 10 * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <AddSemesterRecordForm studentId={s.id} onAdded={loadStudent} />
              </div>
            </div>
          )}

          {/* ── Placement Status tab ── */}
          {tab === 'placement' && (
            <div className="rounded-xl overflow-hidden" style={{ background: t.bg, border: '1px solid #e9ecef' }}>

              {/* Current status */}
              <div className="px-5 py-5" style={{ borderBottom: '1px solid t.bgAlt' }}>
                <span style={SECTION_LABEL}>Current Status</span>
                <div className="flex items-center gap-4">
                  <span style={{
                    display: 'inline-block',
                    borderLeft: `3px solid ${st.accent}`,
                    paddingLeft: '12px',
                    color: st.color,
                    fontFamily: FONT_CONDENSED,
                    fontWeight: 700,
                    fontSize: '1.25rem',
                  }}>
                    {s.status}
                  </span>
                  {s.company && (
                    <div>
                      <p className="text-sm font-semibold" style={{ fontFamily: FONT_DISPLAY, color: t.text }}>{s.company}</p>
                      <p className="text-xs" style={{ color: t.textMuted }}>Current employer / offer</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Applications header */}
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid t.bgAlt' }}>
                <span style={SECTION_LABEL}>Applications</span>
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: '#eef0ff', color: t.accent }}>{s.applications.length} total</span>
              </div>

              {s.applications.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm font-medium" style={{ color: t.textMuted }}>No applications recorded yet.</p>
                  <p className="text-xs mt-1" style={{ color: '#cbd5e1' }}>Applications will appear here once the student applies to drives.</p>
                </div>
              ) : (
                <>
                  {s.applications.map((app, i) => {
                    const appSt = APP_STAGE_STYLE[app.stage]
                    return (
                      <div key={i} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors" style={{ borderBottom: i < s.applications.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                        <div className="w-9 h-9 rounded-md flex items-center justify-center text-xs font-bold shrink-0" style={{ background: '#eef0ff', color: t.accent, fontFamily: FONT_DISPLAY }}>
                          {app.company.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ fontFamily: FONT_DISPLAY, color: t.text }}>{app.company}</p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: t.textMuted }}>{app.role}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span style={{
                            display: 'inline-block',
                            borderLeft: `2px solid ${appSt.accent}`,
                            paddingLeft: '8px',
                            color: appSt.color,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                          }}>
                            {app.stage}
                          </span>
                          {app.package && <p className="text-xs font-semibold mt-1" style={{ color: '#15803d' }}>{app.package}</p>}
                        </div>
                        <span className="text-xs shrink-0" style={{ color: t.textMuted, fontFamily: FONT_MONO }}>{app.date}</span>
                      </div>
                    )
                  })}

                  {/* Interview pipeline */}
                  <div className="px-5 py-5" style={{ borderTop: '1px solid t.bgAlt' }}>
                    <span style={SECTION_LABEL}>Interview Pipeline</span>
                    <div className="flex items-center gap-0">
                      {(['Applied', 'Shortlisted', 'Written Test', 'Technical Interview', 'HR Round', 'Offered'] as Application['stage'][]).map((stage, i, arr) => {
                        const reached = s.applications.some(a => {
                          const order = ['Applied', 'Shortlisted', 'Written Test', 'Technical Interview', 'HR Round', 'Offered', 'Rejected']
                          return order.indexOf(a.stage) >= order.indexOf(stage)
                        })
                        const isLast = i === arr.length - 1
                        return (
                          <div key={stage} className="flex items-center flex-1 min-w-0">
                            <div className="flex flex-col items-center flex-1">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: reached ? t.accent : t.border }}>
                                {reached && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                              </div>
                              <p className="text-center mt-1.5 leading-tight" style={{ fontSize: '9px', color: reached ? t.accent : t.textMuted, fontFamily: FONT_DISPLAY, fontWeight: reached ? 600 : 400, maxWidth: 52 }}>{stage}</p>
                            </div>
                            {!isLast && <div className="h-0.5 flex-1 -mt-4 mx-1" style={{ background: reached ? '#c7d2fe' : t.border, minWidth: 8 }} />}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Placements page
// ─────────────────────────────────────────────────────────────────────────────

function AddApplicationModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const t = useTheme()
  const [form, setForm] = React.useState({ studentId: '', company: '', role: '', appliedDate: '', stage: 'Applied', package: '' })
  const [students, setStudents] = React.useState<StudentListItem[]>([])
  const [studentsLoading, setStudentsLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    api.students.list()
      .then(list => { setStudents(list); setStudentsLoading(false) })
      .catch(() => setStudentsLoading(false))
  }, [])

  async function handleSubmit() {
    if (!form.studentId || !form.company.trim() || !form.role.trim()) {
      setError('Please choose a student, and enter a company and role.')
      return
    }
    setError('')
    setSaving(true)
    try {
      await api.placements.create({
        student_id: Number(form.studentId),
        company: form.company.trim(),
        role: form.role.trim(),
        applied_date: form.appliedDate || undefined,
        stage: form.stage,
        package: form.package || undefined,
      })
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add application')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ background: t.bg }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #e9ecef' }}>
          <div>
            <h3 style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.25rem', color: t.text }}>Log New Application</h3>
            <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>Record a student's application to a company</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors" style={{ color: t.textMuted }}>
            <X size={15} />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#475569', fontFamily: FONT_DISPLAY }}>Student</label>
            <select
              value={form.studentId}
              onChange={set('studentId')}
              className="w-full px-3.5 py-2.5 text-xs rounded-lg outline-none"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: t.text }}
            >
              <option value="">{studentsLoading ? 'Loading students…' : 'Select a student'}</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} · {s.roll}</option>)}
            </select>
          </div>
          {[
            { label: 'Company', key: 'company', placeholder: 'e.g. Razorpay', type: 'text' },
            { label: 'Role', key: 'role', placeholder: 'e.g. Backend Engineer', type: 'text' },
            { label: 'Package (if offered)', key: 'package', placeholder: 'e.g. ₹28 LPA', type: 'text' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#475569', fontFamily: FONT_DISPLAY }}>{f.label}</label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                value={(form as Record<string, string>)[f.key]}
                onChange={set(f.key)}
                className="w-full px-3.5 py-2.5 text-xs rounded-lg outline-none"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: t.text }}
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#475569', fontFamily: FONT_DISPLAY }}>Applied Date</label>
              <input type="date" value={form.appliedDate} onChange={set('appliedDate')} className="w-full px-3.5 py-2.5 text-xs rounded-lg outline-none" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: t.text }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#475569', fontFamily: FONT_DISPLAY }}>Stage</label>
              <FilterSelect value={form.stage} onChange={v => setForm(f => ({ ...f, stage: v }))} options={PLACEMENT_STAGES} />
            </div>
          </div>
          {error && <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: 0 }}>{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #e9ecef' }}>
          <button onClick={onClose} className="text-xs font-medium px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors" style={{ color: t.textMuted, border: '1px solid #e2e8f0' }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="text-xs font-semibold px-5 py-2.5 rounded-lg transition-all hover:opacity-90"
            style={{ background: '#0b1120', color: t.bg, fontFamily: FONT_DISPLAY, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? 'Adding…' : 'Log Application'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PlacementsPage() {
  const t = useTheme()
  const [stageFilter, setStageFilter] = useState<PlacementStage | 'All'>('All')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<PlacementApp | null>(null)
  const [apps, setApps] = useState<PlacementApp[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const loadApps = React.useCallback(() => {
    setLoading(true)
    api.placements.list()
      .then(list => { setApps(list); setLoading(false) })
      .catch(e => { setLoadError(e instanceof Error ? e.message : 'Failed to load placements'); setLoading(false) })
  }, [])

  useEffect(() => { loadApps() }, [loadApps])

  const filtered = useMemo(() => {
    return apps.filter(a => {
      if (stageFilter !== 'All' && a.stage !== stageFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return a.student.toLowerCase().includes(q) || a.company.toLowerCase().includes(q) || a.roll.toLowerCase().includes(q)
      }
      return true
    })
  }, [apps, stageFilter, search])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    apps.forEach(a => { c[a.stage] = (c[a.stage] ?? 0) + 1 })
    return c
  }, [apps])

  const kpi = useMemo(() => {
    const joined = apps.filter(a => a.stage === 'Joined').length
    const offered = apps.filter(a => a.stage === 'Offered').length
    const pipeline = apps.filter(a => a.stage === 'Applied' || a.stage === 'Shortlisted' || a.stage === 'Interviewing').length
    return { total: apps.length, joined, offered, pipeline }
  }, [apps])

  return (
    <div className="px-5 lg:px-7 py-6">
      {showAddModal && <AddApplicationModal onClose={() => setShowAddModal(false)} onCreated={loadApps} />}

      {/* Page header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.625rem', color: t.text, letterSpacing: '0.01em' }}>Placements</h1>
          <p style={{ fontFamily: FONT_BODY, fontSize: '0.8125rem', color: t.textMuted, marginTop: '2px' }}>Placement Season 2025–26 · IIT Hyderabad</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-lg transition-all hover:opacity-90" style={{ background: '#0b1120', color: t.bg, fontFamily: FONT_DISPLAY }}>
          <Plus size={13} /> Log Application
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Applications', value: String(kpi.total) },
          { label: 'Joined', value: String(kpi.joined) },
          { label: 'Offers Outstanding', value: String(kpi.offered) },
          { label: 'In Pipeline', value: String(kpi.pipeline) },
        ].map(k => (
          <div key={k.label} className="rounded-xl px-4 py-4" style={{ background: t.bg, border: '1px solid #e9ecef' }}>
            <p style={{ fontSize: '0.68rem', color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT_BODY }}>{k.label}</p>
            <p style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.75rem', color: t.text, marginTop: '4px' }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Stage filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setStageFilter('All')}
          className="py-1.5 text-xs font-medium transition-all"
          style={{
            paddingLeft: '12px', paddingRight: '12px',
            background: stageFilter === 'All' ? t.bgAlt : t.bg,
            color: stageFilter === 'All' ? t.text : t.textMuted,
            border: '1px solid #e9ecef',
            borderLeft: stageFilter === 'All' ? '3px solid #0b1120' : '3px solid transparent',
            borderRadius: '6px',
            fontFamily: FONT_BODY,
            fontWeight: stageFilter === 'All' ? 600 : 400,
          }}
        >
          All · {apps.length}
        </button>
        {PLACEMENT_STAGES.map(st => {
          const s = PLACEMENT_STAGE_STYLE[st]
          const isActive = stageFilter === st
          return (
            <button
              key={st}
              onClick={() => setStageFilter(isActive ? 'All' : st)}
              className="py-1.5 text-xs font-medium transition-all"
              style={{
                paddingLeft: '12px', paddingRight: '12px',
                background: isActive ? s.accent + '18' : t.bg,
                color: isActive ? s.color : t.textMuted,
                border: '1px solid #e9ecef',
                borderLeft: isActive ? `3px solid ${s.accent}` : '3px solid transparent',
                borderRadius: '6px',
                fontFamily: FONT_BODY,
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {st} · {counts[st] ?? 0}
            </button>
          )
        })}
      </div>

      {/* Search bar */}
      <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3" style={{ background: t.bg, border: '1px solid #e9ecef' }}>
        <Search size={13} style={{ color: t.textMuted, flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search by student, roll number, or company…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-xs outline-none"
          style={{ background: 'transparent', color: t.text, fontFamily: FONT_BODY }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ color: t.textMuted }}><X size={13} /></button>
        )}
      </div>

      {/* Table + detail panel */}
      <div className="flex gap-5">

        {/* Table */}
        <div className="flex-1 rounded-xl overflow-hidden min-w-0" style={{ background: t.bg, border: '1px solid #e9ecef' }}>
          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid t.bgAlt' }}>
            <p className="text-xs" style={{ color: t.textMuted }}>
              Showing <span style={{ color: t.text, fontWeight: 600 }}>{filtered.length}</span> of {apps.length} applications
            </p>
            {selected && (
              <button onClick={() => setSelected(null)} className="text-xs" style={{ color: t.textMuted }}>Close detail ×</button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid t.bgAlt' }}>
                  {['Student', 'Company', 'Role', 'Stage', 'Package', 'Applied'].map(h => (
                    <th key={h} className="text-left px-5 py-3" style={{ fontSize: '0.68rem', fontWeight: 600, color: t.textMuted, fontFamily: FONT_BODY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center">
                      <p className="text-sm" style={{ color: t.textMuted }}>Loading applications…</p>
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center">
                      <p className="text-sm font-medium" style={{ color: '#ef4444' }}>Couldn't load applications: {loadError}</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center">
                      <p className="text-sm" style={{ color: t.textMuted }}>No applications match your filters.</p>
                    </td>
                  </tr>
                ) : filtered.map((a, i) => {
                  const s = PLACEMENT_STAGE_STYLE[a.stage]
                  const isSelected = selected?.id === a.id
                  return (
                    <tr
                      key={a.id}
                      onClick={() => setSelected(isSelected ? null : a)}
                      className="transition-colors cursor-pointer"
                      style={{
                        borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none',
                        background: isSelected ? '#fafbff' : 'transparent',
                      }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: a.avatarBg, color: a.avatarColor, fontFamily: FONT_DISPLAY }}>{a.initials}</div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: t.text, fontFamily: FONT_DISPLAY }}>{a.student}</p>
                            <p className="text-xs" style={{ color: t.textMuted, fontFamily: FONT_MONO }}>{a.roll}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium" style={{ color: t.text, fontFamily: FONT_DISPLAY }}>{a.company}</p>
                        <p className="text-xs" style={{ color: t.textMuted }}>{a.department}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs" style={{ color: t.textMuted }}>{a.role}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span style={{ display: 'inline-block', borderLeft: `2px solid ${s.accent}`, paddingLeft: '8px', color: s.color, fontWeight: 600, fontSize: '0.75rem' }}>
                          {a.stage}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold" style={{ color: a.package ? '#15803d' : '#cbd5e1' }}>{a.package ?? '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs" style={{ color: t.textMuted, fontFamily: FONT_MONO }}>{a.appliedDate}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 shrink-0 rounded-xl overflow-hidden" style={{ background: t.bg, border: '1px solid #e9ecef' }}>

            {/* Student identity */}
            <div className="px-5 py-5 flex flex-col items-center text-center" style={{ borderBottom: '1px solid t.bgAlt' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold mb-3" style={{ background: selected.avatarBg, color: selected.avatarColor, fontFamily: FONT_DISPLAY }}>
                {selected.initials}
              </div>
              <p style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.1rem', color: t.text }}>{selected.student}</p>
              <p className="text-xs mt-0.5" style={{ color: t.textMuted, fontFamily: FONT_MONO }}>{selected.roll}</p>
              <p className="text-xs mt-1" style={{ color: t.textMuted }}>{selected.department}</p>
            </div>

            {/* Company + role */}
            <div className="px-5 py-4" style={{ borderBottom: '1px solid t.bgAlt' }}>
              <span style={SECTION_LABEL}>Application</span>
              <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: '0.875rem', color: t.text }}>{selected.company}</p>
              <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>{selected.role}</p>
              {selected.package && (
                <p className="text-xs font-semibold mt-2" style={{ color: '#15803d' }}>{selected.package}</p>
              )}
            </div>

            {/* Dates */}
            <div className="px-5 py-4" style={{ borderBottom: '1px solid t.bgAlt' }}>
              <span style={SECTION_LABEL}>Timeline</span>
              {[
                { label: 'Applied', value: selected.appliedDate },
                { label: 'Offered', value: selected.offerDate ?? '—' },
                { label: 'Joining', value: selected.joiningDate ?? '—' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between py-1" style={{ borderBottom: '1px solid #f8fafc' }}>
                  <span className="text-xs" style={{ color: t.textMuted }}>{r.label}</span>
                  <span className="text-xs font-medium" style={{ color: r.value === '—' ? '#cbd5e1' : t.text, fontFamily: FONT_MONO }}>{r.value}</span>
                </div>
              ))}
            </div>

            {/* Pipeline */}
            <div className="px-5 py-4">
              <span style={SECTION_LABEL}>Stage Pipeline</span>
              <div className="flex flex-col gap-0">
                {PLACEMENT_STAGES.map((stage, idx) => {
                  const order = PLACEMENT_STAGES.indexOf(selected.stage)
                  const reached = idx <= order
                  const isCurrent = stage === selected.stage
                  const s = PLACEMENT_STAGE_STYLE[stage]
                  return (
                    <div key={stage} className="flex items-start gap-3">
                      <div className="flex flex-col items-center" style={{ marginTop: '2px' }}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: reached ? (isCurrent ? s.accent : '#c7d2fe') : t.bgAlt, border: isCurrent ? `2px solid ${s.accent}` : 'none' }}>
                          {reached && !isCurrent && (
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="t.accent" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                          )}
                        </div>
                        {idx < PLACEMENT_STAGES.length - 1 && (
                          <div className="w-0.5 h-5" style={{ background: reached ? '#c7d2fe' : t.bgAlt }} />
                        )}
                      </div>
                      <p className="pb-2 text-xs" style={{ color: isCurrent ? s.color : reached ? t.textMuted : '#cbd5e1', fontWeight: isCurrent ? 700 : 400, fontFamily: FONT_BODY, paddingTop: '2px' }}>
                        {stage}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Internships page
// ─────────────────────────────────────────────────────────────────────────────

function AddInternshipModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const t = useTheme()
  const [form, setForm] = React.useState({
    studentId: '', company: '', role: '', duration: '', startDate: '', endDate: '', mentor: '', stipend: '',
    ppoEligible: false, status: 'Ongoing',
  })
  const [students, setStudents] = React.useState<StudentListItem[]>([])
  const [studentsLoading, setStudentsLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    api.students.list()
      .then(list => { setStudents(list); setStudentsLoading(false) })
      .catch(() => setStudentsLoading(false))
  }, [])

  async function handleSubmit() {
    if (!form.studentId || !form.company.trim() || !form.role.trim()) {
      setError('Please choose a student, and enter a company and role.')
      return
    }
    setError('')
    setSaving(true)
    try {
      await api.internships.create({
        student_id: Number(form.studentId),
        company: form.company.trim(),
        role: form.role.trim(),
        duration: form.duration || undefined,
        start_date: form.startDate || undefined,
        end_date: form.endDate || undefined,
        mentor: form.mentor || undefined,
        stipend: form.stipend || undefined,
        ppo_eligible: form.ppoEligible,
        status: form.status,
      })
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add internship')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ background: t.bg, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #e9ecef' }}>
          <div>
            <h3 style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.25rem', color: t.text }}>Add Internship</h3>
            <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>Track a student's internship placement</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors" style={{ color: t.textMuted }}>
            <X size={15} />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#475569', fontFamily: FONT_DISPLAY }}>Student</label>
            <select
              value={form.studentId}
              onChange={set('studentId')}
              className="w-full px-3.5 py-2.5 text-xs rounded-lg outline-none"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: t.text }}
            >
              <option value="">{studentsLoading ? 'Loading students…' : 'Select a student'}</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} · {s.roll}</option>)}
            </select>
          </div>
          {[
            { label: 'Company', key: 'company', placeholder: 'e.g. Bosch India', type: 'text' },
            { label: 'Role', key: 'role', placeholder: 'e.g. Embedded Systems Intern', type: 'text' },
            { label: 'Duration', key: 'duration', placeholder: 'e.g. 3 months', type: 'text' },
            { label: 'Mentor', key: 'mentor', placeholder: 'e.g. Ravi Menon', type: 'text' },
            { label: 'Stipend', key: 'stipend', placeholder: 'e.g. ₹35K/mo', type: 'text' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#475569', fontFamily: FONT_DISPLAY }}>{f.label}</label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                value={(form as Record<string, string>)[f.key]}
                onChange={set(f.key)}
                className="w-full px-3.5 py-2.5 text-xs rounded-lg outline-none"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: t.text }}
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#475569', fontFamily: FONT_DISPLAY }}>Start Date</label>
              <input type="date" value={form.startDate} onChange={set('startDate')} className="w-full px-3.5 py-2.5 text-xs rounded-lg outline-none" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: t.text }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#475569', fontFamily: FONT_DISPLAY }}>End Date</label>
              <input type="date" value={form.endDate} onChange={set('endDate')} className="w-full px-3.5 py-2.5 text-xs rounded-lg outline-none" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: t.text }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#475569', fontFamily: FONT_DISPLAY }}>Status</label>
              <FilterSelect value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={['Ongoing', 'Completed', 'Withdrawn']} />
            </div>
            <label className="flex items-center gap-2 pb-2.5 text-xs" style={{ color: t.text, fontFamily: FONT_DISPLAY }}>
              <input type="checkbox" checked={form.ppoEligible} onChange={e => setForm(f => ({ ...f, ppoEligible: e.target.checked }))} />
              PPO Eligible
            </label>
          </div>
          {error && <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: 0 }}>{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #e9ecef' }}>
          <button onClick={onClose} className="text-xs font-medium px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors" style={{ color: t.textMuted, border: '1px solid #e2e8f0' }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="text-xs font-semibold px-5 py-2.5 rounded-lg transition-all hover:opacity-90"
            style={{ background: '#0b1120', color: t.bg, fontFamily: FONT_DISPLAY, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? 'Adding…' : 'Add Internship'}
          </button>
        </div>
      </div>
    </div>
  )
}

function InternshipsPage() {
  const t = useTheme()
  const [statusFilter, setStatusFilter] = useState<InternshipStatus | 'All'>('All')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Internship | null>(null)
  const [internships, setInternships] = useState<Internship[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const loadInternships = React.useCallback(() => {
    setLoading(true)
    api.internships.list()
      .then(list => { setInternships(list); setLoading(false) })
      .catch(e => { setLoadError(e instanceof Error ? e.message : 'Failed to load internships'); setLoading(false) })
  }, [])

  useEffect(() => { loadInternships() }, [loadInternships])

  const filtered = useMemo(() => {
    return internships.filter(a => {
      if (statusFilter !== 'All' && a.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return a.student.toLowerCase().includes(q) || a.company.toLowerCase().includes(q) || a.roll.toLowerCase().includes(q)
      }
      return true
    })
  }, [internships, statusFilter, search])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    internships.forEach(a => { c[a.status] = (c[a.status] ?? 0) + 1 })
    return c
  }, [internships])

  const ppoConverted = internships.filter(a => a.ppoConverted).length
  const ongoing = internships.filter(a => a.status === 'Ongoing').length
  const completed = internships.filter(a => a.status === 'Completed').length

  return (
    <div className="px-5 lg:px-7 py-6">
      {showAddModal && <AddInternshipModal onClose={() => setShowAddModal(false)} onCreated={loadInternships} />}

      {/* Page header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.625rem', color: t.text, letterSpacing: '0.01em' }}>Internships</h1>
          <p style={{ fontFamily: FONT_BODY, fontSize: '0.8125rem', color: t.textMuted, marginTop: '2px' }}>Internship Tracking · IIT Hyderabad</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-lg transition-all hover:opacity-90" style={{ background: '#0b1120', color: t.bg, fontFamily: FONT_DISPLAY }}>
          <Plus size={13} /> Add Internship
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Internships', value: String(internships.length) },
          { label: 'Ongoing', value: String(ongoing) },
          { label: 'Completed', value: String(completed) },
          { label: 'PPO Converted', value: String(ppoConverted) },
        ].map(k => (
          <div key={k.label} className="rounded-xl px-4 py-4" style={{ background: t.bg, border: '1px solid #e9ecef' }}>
            <p style={{ fontSize: '0.68rem', color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT_BODY }}>{k.label}</p>
            <p style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.75rem', color: t.text, marginTop: '4px' }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setStatusFilter('All')}
          className="py-1.5 text-xs font-medium transition-all"
          style={{
            paddingLeft: '12px', paddingRight: '12px',
            background: statusFilter === 'All' ? t.bgAlt : t.bg,
            color: statusFilter === 'All' ? t.text : t.textMuted,
            border: '1px solid #e9ecef',
            borderLeft: statusFilter === 'All' ? '3px solid #0b1120' : '3px solid transparent',
            borderRadius: '6px',
            fontWeight: statusFilter === 'All' ? 600 : 400,
          }}
        >
          All · {internships.length}
        </button>
        {(['Ongoing', 'Completed', 'Withdrawn'] as InternshipStatus[]).map(st => {
          const s = INTERNSHIP_STATUS_STYLE[st]
          const isActive = statusFilter === st
          return (
            <button
              key={st}
              onClick={() => setStatusFilter(isActive ? 'All' : st)}
              className="py-1.5 text-xs font-medium transition-all"
              style={{
                paddingLeft: '12px', paddingRight: '12px',
                background: isActive ? s.accent + '18' : t.bg,
                color: isActive ? s.color : t.textMuted,
                border: '1px solid #e9ecef',
                borderLeft: isActive ? `3px solid ${s.accent}` : '3px solid transparent',
                borderRadius: '6px',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {st} · {counts[st] ?? 0}
            </button>
          )
        })}
      </div>

      {/* Search bar */}
      <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3" style={{ background: t.bg, border: '1px solid #e9ecef' }}>
        <Search size={13} style={{ color: t.textMuted, flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search by student, roll number, or company…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-xs outline-none"
          style={{ background: 'transparent', color: t.text, fontFamily: FONT_BODY }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ color: t.textMuted }}><X size={13} /></button>
        )}
      </div>

      {/* Table + detail panel */}
      <div className="flex gap-5">

        {/* Table */}
        <div className="flex-1 rounded-xl overflow-hidden min-w-0" style={{ background: t.bg, border: '1px solid #e9ecef' }}>
          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid t.bgAlt' }}>
            <p className="text-xs" style={{ color: t.textMuted }}>
              Showing <span style={{ color: t.text, fontWeight: 600 }}>{filtered.length}</span> of {internships.length} internships
            </p>
            {selected && (
              <button onClick={() => setSelected(null)} className="text-xs" style={{ color: t.textMuted }}>Close detail ×</button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid t.bgAlt' }}>
                  {['Student', 'Company / Role', 'Duration', 'Stipend', 'PPO', 'Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3" style={{ fontSize: '0.68rem', fontWeight: 600, color: t.textMuted, fontFamily: FONT_BODY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center">
                      <p className="text-sm" style={{ color: t.textMuted }}>Loading internships…</p>
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center">
                      <p className="text-sm font-medium" style={{ color: '#ef4444' }}>Couldn't load internships: {loadError}</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center">
                      <p className="text-sm" style={{ color: t.textMuted }}>No internships match your filters.</p>
                    </td>
                  </tr>
                ) : filtered.map((a, i) => {
                  const s = INTERNSHIP_STATUS_STYLE[a.status]
                  const isSelected = selected?.id === a.id
                  return (
                    <tr
                      key={a.id}
                      onClick={() => setSelected(isSelected ? null : a)}
                      className="transition-colors cursor-pointer"
                      style={{
                        borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none',
                        background: isSelected ? '#fafbff' : 'transparent',
                      }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: a.avatarBg, color: a.avatarColor, fontFamily: FONT_DISPLAY }}>{a.initials}</div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: t.text, fontFamily: FONT_DISPLAY }}>{a.student}</p>
                            <p className="text-xs" style={{ color: t.textMuted, fontFamily: FONT_MONO }}>{a.roll}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium" style={{ color: t.text, fontFamily: FONT_DISPLAY }}>{a.company}</p>
                        <p className="text-xs" style={{ color: t.textMuted }}>{a.role}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-medium" style={{ color: t.text }}>{a.duration}</p>
                        <p className="text-xs" style={{ color: t.textMuted, fontFamily: FONT_MONO }}>{a.startDate} – {a.endDate}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold" style={{ color: t.text }}>{a.stipend}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {a.ppoEligible ? (
                          <span style={{
                            display: 'inline-block',
                            borderLeft: a.ppoConverted ? '2px solid #22c55e' : '2px solid t.textMuted',
                            paddingLeft: '8px',
                            color: a.ppoConverted ? '#15803d' : t.textMuted,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                          }}>
                            {a.ppoConverted ? 'Converted' : 'Eligible'}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: '#cbd5e1' }}>Not eligible</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span style={{ display: 'inline-block', borderLeft: `2px solid ${s.accent}`, paddingLeft: '8px', color: s.color, fontWeight: 600, fontSize: '0.75rem' }}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 shrink-0 rounded-xl overflow-hidden" style={{ background: t.bg, border: '1px solid #e9ecef' }}>

            {/* Student identity */}
            <div className="px-5 py-5 flex flex-col items-center text-center" style={{ borderBottom: '1px solid t.bgAlt' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold mb-3" style={{ background: selected.avatarBg, color: selected.avatarColor, fontFamily: FONT_DISPLAY }}>
                {selected.initials}
              </div>
              <p style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.1rem', color: t.text }}>{selected.student}</p>
              <p className="text-xs mt-0.5" style={{ color: t.textMuted, fontFamily: FONT_MONO }}>{selected.roll}</p>
              <p className="text-xs mt-1" style={{ color: t.textMuted }}>{selected.department}</p>
            </div>

            {/* Internship details */}
            <div className="px-5 py-4" style={{ borderBottom: '1px solid t.bgAlt' }}>
              <span style={SECTION_LABEL}>Internship</span>
              <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: '0.875rem', color: t.text }}>{selected.company}</p>
              <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>{selected.role}</p>
              <div className="mt-3 flex items-center gap-2">
                <span style={{ display: 'inline-block', borderLeft: `2px solid ${INTERNSHIP_STATUS_STYLE[selected.status].accent}`, paddingLeft: '8px', color: INTERNSHIP_STATUS_STYLE[selected.status].color, fontWeight: 600, fontSize: '0.75rem' }}>
                  {selected.status}
                </span>
              </div>
            </div>

            {/* Meta fields */}
            <div className="px-5 py-4" style={{ borderBottom: '1px solid t.bgAlt' }}>
              <span style={SECTION_LABEL}>Details</span>
              {[
                { label: 'Duration', value: selected.duration },
                { label: 'Start', value: selected.startDate },
                { label: 'End', value: selected.endDate },
                { label: 'Stipend', value: selected.stipend },
                { label: 'Mentor', value: selected.mentor },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #f8fafc' }}>
                  <span className="text-xs" style={{ color: t.textMuted }}>{r.label}</span>
                  <span className="text-xs font-medium" style={{ color: t.text, fontFamily: r.label === 'Start' || r.label === 'End' ? FONT_MONO : FONT_DISPLAY }}>{r.value}</span>
                </div>
              ))}
            </div>

            {/* PPO status */}
            <div className="px-5 py-4">
              <span style={SECTION_LABEL}>PPO Status</span>
              {!selected.ppoEligible ? (
                <p className="text-xs" style={{ color: t.textMuted }}>Not eligible for PPO</p>
              ) : selected.ppoConverted ? (
                <div>
                  <span style={{ display: 'inline-block', borderLeft: '2px solid #22c55e', paddingLeft: '8px', color: '#15803d', fontWeight: 700, fontSize: '0.8125rem' }}>PPO Converted</span>
                  <p className="text-xs mt-1" style={{ color: t.textMuted }}>Pre-placement offer accepted</p>
                </div>
              ) : (
                <div>
                  <span style={{ display: 'inline-block', borderLeft: '2px solid #f59e0b', paddingLeft: '8px', color: '#a16207', fontWeight: 600, fontSize: '0.8125rem' }}>PPO Eligible</span>
                  <p className="text-xs mt-1" style={{ color: t.textMuted }}>Awaiting offer or decision</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// DrivesPage
// ─────────────────────────────────────────────────────────────────────────────

function CreateDriveModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const t = useTheme()
  const FONT_BODY = "'Inter', sans-serif"
  const FONT_DISPLAY = "'Plus Jakarta Sans', sans-serif"
  const [type, setType] = React.useState<DriveType>('FTE')
  const [form, setForm] = React.useState({ companyId: '', position: '', package: '', eligibility: '', skills: '', deadline: '', interviewDate: '', venue: '' })
  const [companies, setCompanies] = React.useState<CRMCompany[]>([])
  const [companiesLoading, setCompaniesLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    api.companies.list()
      .then(list => { setCompanies(list); setCompaniesLoading(false) })
      .catch(() => setCompaniesLoading(false))
  }, [])

  async function handleSubmit() {
    if (!form.companyId || !form.position.trim()) {
      setError('Please choose a company and enter a position.')
      return
    }
    setError('')
    setSaving(true)
    try {
      await api.drives.create({
        company_id: Number(form.companyId),
        position: form.position.trim(),
        package: form.package || undefined,
        type,
        eligibility: form.eligibility || undefined,
        skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        registration_deadline: form.deadline || undefined,
        interview_date: form.interviewDate || undefined,
        venue: form.venue || undefined,
      })
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create drive')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: t.bg, borderRadius: 16, width: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #e9ecef' }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: '1rem', color: t.text }}>Create Placement Drive</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Drive type toggle */}
          <div>
            <span style={{ fontFamily: FONT_BODY, fontSize: '0.75rem', fontWeight: 600, color: t.textMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Drive Type</span>
            <div className="flex gap-2 mt-2">
              {(['FTE', 'Internship', 'FTE + Internship'] as DriveType[]).map(driveType => (
                <button key={driveType} onClick={() => setType(driveType)} style={{ padding: '5px 14px', borderRadius: 20, border: `1.5px solid ${type === driveType ? t.accent : '#e2e8f0'}`, background: type === driveType ? '#eef2ff' : t.bg, color: type === driveType ? t.accent : t.textMuted, fontFamily: FONT_BODY, fontSize: '0.78rem', fontWeight: type === driveType ? 600 : 400, cursor: 'pointer' }}>{driveType}</button>
              ))}
            </div>
          </div>

          {/* Company select */}
          <div>
            <label style={{ fontFamily: FONT_BODY, fontSize: '0.75rem', fontWeight: 600, color: t.textMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Company</label>
            <select
              value={form.companyId}
              onChange={e => set('companyId', e.target.value)}
              style={{ marginTop: 6, width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontFamily: FONT_BODY, fontSize: '0.85rem', color: t.text, outline: 'none', background: '#fafafa' }}
            >
              <option value="">{companiesLoading ? 'Loading companies…' : 'Select a company'}</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {!companiesLoading && companies.length === 0 && (
              <p style={{ fontFamily: FONT_BODY, fontSize: '0.72rem', color: t.textMuted, marginTop: 4 }}>No companies yet — add one on the Companies page first.</p>
            )}
          </div>

          {/* Text fields */}
          {[
            { k: 'position', label: 'Position / Role', placeholder: 'e.g. SWE — L3' },
            { k: 'package', label: 'Package (CTC)', placeholder: 'e.g. ₹24 LPA' },
            { k: 'eligibility', label: 'Eligibility Criteria', placeholder: 'e.g. CGPA ≥ 7.5, CS/EC departments' },
            { k: 'skills', label: 'Required Skills', placeholder: 'Comma-separated, e.g. Python, DSA, System Design' },
            { k: 'venue', label: 'Venue', placeholder: 'e.g. Main Campus Hall / Online' },
          ].map(({ k, label, placeholder }) => (
            <div key={k}>
              <label style={{ fontFamily: FONT_BODY, fontSize: '0.75rem', fontWeight: 600, color: t.textMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</label>
              <input
                value={(form as Record<string, string>)[k]}
                onChange={e => set(k, e.target.value)}
                placeholder={placeholder}
                style={{ marginTop: 6, width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontFamily: FONT_BODY, fontSize: '0.85rem', color: t.text, outline: 'none', background: '#fafafa' }}
              />
            </div>
          ))}

          {/* Date fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontFamily: FONT_BODY, fontSize: '0.75rem', fontWeight: 600, color: t.textMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Registration Deadline</label>
              <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} style={{ marginTop: 6, width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontFamily: FONT_BODY, fontSize: '0.85rem', color: t.text, outline: 'none', background: '#fafafa' }} />
            </div>
            <div>
              <label style={{ fontFamily: FONT_BODY, fontSize: '0.75rem', fontWeight: 600, color: t.textMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Interview Date</label>
              <input type="date" value={form.interviewDate} onChange={e => set('interviewDate', e.target.value)} style={{ marginTop: 6, width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontFamily: FONT_BODY, fontSize: '0.85rem', color: t.text, outline: 'none', background: '#fafafa' }} />
            </div>
          </div>

          {error && <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
        </div>
        <div className="flex gap-3 justify-end px-6 py-4" style={{ borderTop: '1px solid #e9ecef' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: t.bg, fontFamily: FONT_BODY, fontSize: '0.85rem', color: t.textMuted, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: t.accent, fontFamily: FONT_BODY, fontSize: '0.85rem', color: t.bg, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>{saving ? 'Creating…' : 'Create Drive'}</button>
        </div>
      </div>
    </div>
  )
}

function DrivesPage() {
  const t = useTheme()
  const FONT_CONDENSED = "'Barlow Condensed', sans-serif"
  const FONT_DISPLAY = "'Plus Jakarta Sans', sans-serif"
  const FONT_BODY = "'Inter', sans-serif"
  const SECTION_LABEL: React.CSSProperties = { fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.textMuted, fontFamily: "'Inter', sans-serif", marginBottom: '12px', display: 'block' }

  const [statusFilter, setStatusFilter] = React.useState<DriveStatus2 | 'All'>('All')
  const [search, setSearch] = React.useState('')
  const [selectedDrive, setSelectedDrive] = React.useState<PlacementDrive | null>(null)
  const [showCreate, setShowCreate] = React.useState(false)
  const [drives, setDrives] = React.useState<PlacementDrive[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState('')

  const loadDrives = React.useCallback(() => {
    setLoading(true)
    api.drives.list()
      .then(list => { setDrives(list); setLoading(false) })
      .catch(e => { setLoadError(e instanceof Error ? e.message : 'Failed to load drives'); setLoading(false) })
  }, [])

  useEffect(() => { loadDrives() }, [loadDrives])

  const filtered = drives.filter(d =>
    (statusFilter === 'All' || d.status === statusFilter) &&
    (d.company.toLowerCase().includes(search.toLowerCase()) || d.position.toLowerCase().includes(search.toLowerCase()))
  )

  const kpis = [
    { label: 'Total Drives', value: drives.length },
    { label: 'Open Now', value: drives.filter(d => d.status === 'Open').length },
    { label: 'Upcoming', value: drives.filter(d => d.status === 'Upcoming').length },
    { label: 'Completed', value: drives.filter(d => d.status === 'Completed').length },
    { label: 'Total Applicants', value: drives.reduce((s, d) => s + d.applications, 0) },
  ]

  return (
    <div style={{ padding: '28px 32px', minHeight: '100%', background: '#f8fafc' }}>
      {showCreate && <CreateDriveModal onClose={() => setShowCreate(false)} onCreated={loadDrives} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 style={{ fontFamily: FONT_CONDENSED, fontWeight: 800, fontSize: '2rem', color: t.text, letterSpacing: '-0.01em', margin: 0, lineHeight: 1.1 }}>Placement Drives</h1>
          <p style={{ fontFamily: FONT_BODY, fontSize: '0.8rem', color: t.textMuted, marginTop: 4 }}>Manage and track all on-campus recruitment drives</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: t.accent, border: 'none', borderRadius: 9, color: t.bg, fontFamily: FONT_BODY, fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer' }}>
          <Plus size={14} /> Create Drive
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {kpis.map(k => (
          <div key={k.label} style={{ background: t.bg, border: '1px solid #e9ecef', borderRadius: 10, padding: '14px 16px' }}>
            <span style={SECTION_LABEL}>{k.label}</span>
            <span style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.6rem', color: t.text, lineHeight: 1 }}>{k.value}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Table column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Controls */}
          <div className="flex items-center gap-3 mb-4">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company or position…" style={{ flex: 1, padding: '8px 12px', border: '1.5px solid t.border', borderRadius: 8, fontFamily: FONT_BODY, fontSize: '0.83rem', outline: 'none', background: t.bg }} />
            <div className="flex gap-2">
              {(['All', 'Open', 'Upcoming', 'Completed', 'Closed'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${statusFilter === s ? t.accent : t.border}`, background: statusFilter === s ? '#eef2ff' : t.bg, color: statusFilter === s ? t.accent : t.textMuted, fontFamily: FONT_BODY, fontSize: '0.75rem', fontWeight: statusFilter === s ? 600 : 400, cursor: 'pointer' }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ background: t.bg, border: '1px solid #e9ecef', borderRadius: 12, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 0.8fr 0.8fr 0.9fr', padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid t.bgAlt' }}>
              {['Company / Position', 'Package', 'Type', 'Deadline', 'Applications', 'Status'].map(h => (
                <span key={h} style={{ fontFamily: FONT_BODY, fontSize: '0.67rem', fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
              ))}
            </div>
            {filtered.map((d, i) => {
              const st = DRIVE_PAGE_STATUS[d.status]
              const isSelected = selectedDrive?.id === d.id
              return (
                <div key={d.id} onClick={() => setSelectedDrive(isSelected ? null : d)} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 0.8fr 0.8fr 0.9fr', padding: '13px 16px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', background: isSelected ? '#f5f7ff' : t.bg, cursor: 'pointer', transition: 'background 0.15s' }}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span style={{ width: 26, height: 26, borderRadius: 6, background: d.logoBg, color: d.logoColor, fontFamily: FONT_BODY, fontSize: '0.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{d.logo}</span>
                      <div>
                        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: '0.83rem', color: t.text, lineHeight: 1.2 }}>{d.company}</div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: '0.72rem', color: t.textMuted, lineHeight: 1 }}>{d.position}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: '0.83rem', color: t.text, alignSelf: 'center' }}>{d.package}</div>
                  <div style={{ alignSelf: 'center' }}>
                    <span style={{ fontFamily: FONT_BODY, fontSize: '0.72rem', fontWeight: 600, color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: 4 }}>{d.type}</span>
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: '0.78rem', color: t.textMuted, alignSelf: 'center' }}>{d.registrationDeadline}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: '0.83rem', color: t.text, fontWeight: 600, alignSelf: 'center' }}>{d.applications || '—'}</div>
                  <div style={{ alignSelf: 'center' }}>
                    <span style={{ display: 'inline-block', borderLeft: `2px solid ${st.accent}`, paddingLeft: 8, color: st.color, fontWeight: 600, fontSize: '0.75rem', fontFamily: FONT_BODY }}>{d.status}</span>
                  </div>
                </div>
              )
            })}
            {loading && (
              <div style={{ padding: '40px', textAlign: 'center', color: t.textMuted, fontFamily: FONT_BODY, fontSize: '0.83rem' }}>Loading drives…</div>
            )}
            {!loading && loadError && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444', fontFamily: FONT_BODY, fontSize: '0.83rem' }}>Couldn't load drives: {loadError}</div>
            )}
            {!loading && !loadError && filtered.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: t.textMuted, fontFamily: FONT_BODY, fontSize: '0.83rem' }}>No drives found</div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selectedDrive && (
          <div style={{ width: 300, flexShrink: 0, background: t.bg, border: '1px solid #e9ecef', borderRadius: 12, overflow: 'hidden', alignSelf: 'flex-start' }}>
            <div className="px-5 py-5" style={{ borderBottom: '1px solid t.bgAlt' }}>
              <div className="flex items-center gap-3 mb-4">
                <span style={{ width: 36, height: 36, borderRadius: 9, background: selectedDrive.logoBg, color: selectedDrive.logoColor, fontFamily: FONT_BODY, fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{selectedDrive.logo}</span>
                <div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: '0.95rem', color: t.text }}>{selectedDrive.company}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: '0.78rem', color: t.textMuted }}>{selectedDrive.position}</div>
                </div>
              </div>
              <div style={{ display: 'inline-block', borderLeft: `2px solid ${DRIVE_PAGE_STATUS[selectedDrive.status].accent}`, paddingLeft: 8, color: DRIVE_PAGE_STATUS[selectedDrive.status].color, fontWeight: 600, fontSize: '0.75rem', fontFamily: FONT_BODY }}>{selectedDrive.status}</div>
            </div>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid t.bgAlt' }}>
              <span style={SECTION_LABEL}>Drive Details</span>
              {[
                { label: 'Package', value: selectedDrive.package },
                { label: 'Type', value: selectedDrive.type },
                { label: 'Venue', value: selectedDrive.venue },
                { label: 'Registration Deadline', value: selectedDrive.registrationDeadline },
                { label: 'Interview Date', value: selectedDrive.interviewDate },
                { label: 'Applications', value: selectedDrive.applications ? String(selectedDrive.applications) : 'Not yet open' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2" style={{ borderBottom: '1px solid #f8fafc' }}>
                  <span style={{ fontFamily: FONT_BODY, fontSize: '0.75rem', color: t.textMuted }}>{label}</span>
                  <span style={{ fontFamily: FONT_BODY, fontSize: '0.78rem', color: t.text, fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid t.bgAlt' }}>
              <span style={SECTION_LABEL}>Eligibility</span>
              <p style={{ fontFamily: FONT_BODY, fontSize: '0.78rem', color: t.text, lineHeight: 1.5, margin: 0 }}>{selectedDrive.eligibility}</p>
            </div>
            <div className="px-5 py-4">
              <span style={SECTION_LABEL}>Required Skills</span>
              <div className="flex flex-wrap gap-2">
                {selectedDrive.skills.map(s => (
                  <span key={s} style={{ fontFamily: FONT_BODY, fontSize: '0.72rem', fontWeight: 600, color: t.accent, background: '#eef2ff', padding: '3px 10px', borderRadius: 20 }}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CompaniesPage
// ─────────────────────────────────────────────────────────────────────────────

function AddCompanyModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const t = useTheme()
  const FONT_CONDENSED = "'Barlow Condensed', sans-serif"
  const FONT_DISPLAY = "'Plus Jakarta Sans', sans-serif"
  const [form, setForm] = React.useState({ name: '', industry: '', location: '', hr_name: '', hr_email: '', hr_phone: '', avg_package_lpa: '', highest_package_lpa: '' })
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit() {
    if (!form.name.trim()) { setError('Company name is required.'); return }
    setError('')
    setSaving(true)
    try {
      await api.companies.create({
        name: form.name.trim(),
        industry: form.industry || undefined,
        location: form.location || undefined,
        hr_name: form.hr_name || undefined,
        hr_email: form.hr_email || undefined,
        hr_phone: form.hr_phone || undefined,
        avg_package_lpa: form.avg_package_lpa ? Number(form.avg_package_lpa) : undefined,
        highest_package_lpa: form.highest_package_lpa ? Number(form.highest_package_lpa) : undefined,
      })
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add company')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ background: t.bg }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #e9ecef' }}>
          <div>
            <h3 style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.25rem', color: t.text }}>Add New Company</h3>
            <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>Add a recruiting partner to the CRM</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors" style={{ color: t.textMuted }}>
            <X size={15} />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          {[
            { label: 'Company Name', key: 'name', placeholder: 'e.g. Google India' },
            { label: 'Industry', key: 'industry', placeholder: 'e.g. Technology' },
            { label: 'Location', key: 'location', placeholder: 'e.g. Bengaluru' },
            { label: 'HR Contact Name', key: 'hr_name', placeholder: 'e.g. Shreya Kapoor' },
            { label: 'HR Email', key: 'hr_email', placeholder: 'e.g. hr@company.com' },
            { label: 'HR Phone', key: 'hr_phone', placeholder: 'e.g. +91 98400 11000' },
            { label: 'Avg. Package (LPA)', key: 'avg_package_lpa', placeholder: 'e.g. 24' },
            { label: 'Highest Package (LPA)', key: 'highest_package_lpa', placeholder: 'e.g. 42' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#475569', fontFamily: FONT_DISPLAY }}>{f.label}</label>
              <input
                value={(form as Record<string, string>)[f.key]}
                onChange={set(f.key)}
                placeholder={f.placeholder}
                className="w-full px-3.5 py-2.5 text-xs rounded-lg outline-none"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: t.text }}
              />
            </div>
          ))}
          {error && <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: 0 }}>{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #e9ecef' }}>
          <button onClick={onClose} className="text-xs font-medium px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors" style={{ color: t.textMuted, border: '1px solid #e2e8f0' }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="text-xs font-semibold px-5 py-2.5 rounded-lg transition-all hover:opacity-90"
            style={{ background: '#0b1120', color: t.bg, fontFamily: FONT_DISPLAY, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? 'Adding…' : 'Add Company'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddJobHistoryForm({ companyId, onAdded }: { companyId: number; onAdded: () => void }) {
  const t = useTheme()
  const FONT_BODY = "'Inter', sans-serif"
  const [open, setOpen] = React.useState(false)
  const [year, setYear] = React.useState('')
  const [role, setRole] = React.useState('')
  const [hired, setHired] = React.useState('')
  const [pkg, setPkg] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')

  async function handleSave() {
    if (!year.trim() || !role.trim()) { setError('Year and role are required.'); return }
    setError('')
    setSaving(true)
    try {
      await api.companies.addJobHistory(companyId, { year: year.trim(), role: role.trim(), hired: hired ? Number(hired) : undefined, package: pkg || undefined })
      setYear(''); setRole(''); setHired(''); setPkg('')
      setOpen(false)
      onAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add entry')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ marginTop: 10, fontFamily: FONT_BODY, fontSize: '0.75rem', fontWeight: 600, color: t.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        + Add hiring history entry
      </button>
    )
  }

  return (
    <div style={{ marginTop: 10, border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="grid grid-cols-2 gap-2">
        <input value={year} onChange={e => setYear(e.target.value)} placeholder="Year (e.g. 2026)" style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontFamily: FONT_BODY, fontSize: '0.78rem', outline: 'none' }} />
        <input value={hired} onChange={e => setHired(e.target.value)} placeholder="Hired count" style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontFamily: FONT_BODY, fontSize: '0.78rem', outline: 'none' }} />
      </div>
      <input value={role} onChange={e => setRole(e.target.value)} placeholder="Role (e.g. SDE-I)" style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontFamily: FONT_BODY, fontSize: '0.78rem', outline: 'none' }} />
      <input value={pkg} onChange={e => setPkg(e.target.value)} placeholder="Package (e.g. ₹24 LPA)" style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontFamily: FONT_BODY, fontSize: '0.78rem', outline: 'none' }} />
      {error && <p style={{ color: '#dc2626', fontSize: '0.72rem', margin: 0 }}>{error}</p>}
      <div className="flex gap-2 justify-end">
        <button onClick={() => setOpen(false)} style={{ fontFamily: FONT_BODY, fontSize: '0.72rem', color: t.textMuted, background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ fontFamily: FONT_BODY, fontSize: '0.72rem', fontWeight: 600, color: '#fff', background: t.accent, border: 'none', borderRadius: 6, padding: '5px 10px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  )
}

function CompaniesPage() {
  const t = useTheme()
  const FONT_CONDENSED = "'Barlow Condensed', sans-serif"
  const FONT_DISPLAY = "'Plus Jakarta Sans', sans-serif"
  const FONT_BODY = "'Inter', sans-serif"
  const SECTION_LABEL: React.CSSProperties = { fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.textMuted, fontFamily: "'Inter', sans-serif", marginBottom: '12px', display: 'block' }

  const [search, setSearch] = React.useState('')
  const [selected, setSelected] = React.useState<CRMCompany | null>(null)
  const [companies, setCompanies] = React.useState<CRMCompany[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState('')
  const [showAddModal, setShowAddModal] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [actionError, setActionError] = React.useState('')

  const loadCompanies = React.useCallback((keepSelectionId?: number) => {
    setLoading(true)
    api.companies.list()
      .then(list => {
        setCompanies(list)
        setSelected(keepSelectionId ? (list.find(c => c.id === keepSelectionId) ?? list[0] ?? null) : (list[0] ?? null))
        setLoading(false)
      })
      .catch(e => { setLoadError(e instanceof Error ? e.message : 'Failed to load companies'); setLoading(false) })
  }, [])

  useEffect(() => { loadCompanies() }, [loadCompanies])

  async function handleDelete(id: number) {
    setActionError('')
    setDeleting(true)
    try {
      await api.companies.delete(id)
      loadCompanies()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete company')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.industry.toLowerCase().includes(search.toLowerCase())
  )

  const kpis = [
    { label: 'Total Companies', value: companies.length },
    { label: 'Total Students Hired', value: companies.reduce((s, c) => s + c.studentsHired, 0) },
    { label: 'Total Visits', value: companies.reduce((s, c) => s + c.pastVisits, 0) },
  ]

  return (
    <div style={{ padding: '28px 32px', minHeight: '100%', background: '#f8fafc' }}>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: FONT_CONDENSED, fontWeight: 800, fontSize: '2rem', color: t.text, letterSpacing: '-0.01em', margin: 0, lineHeight: 1.1 }}>Company CRM</h1>
          <p style={{ fontFamily: FONT_BODY, fontSize: '0.8rem', color: t.textMuted, marginTop: 4 }}>HR contacts, visit history, and hiring analytics</p>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: t.accent, border: 'none', borderRadius: 9, color: t.bg, fontFamily: FONT_BODY, fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer' }}>
          <Plus size={14} /> Add Company
        </button>
      </div>
      {showAddModal && <AddCompanyModal onClose={() => setShowAddModal(false)} onCreated={() => loadCompanies()} />}

      {/* KPI strip */}
      <div className="flex gap-3 mb-5">
        {kpis.map(k => (
          <div key={k.label} style={{ background: t.bg, border: '1px solid #e9ecef', borderRadius: 10, padding: '14px 20px' }}>
            <span style={SECTION_LABEL}>{k.label}</span>
            <span style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.6rem', color: t.text, lineHeight: 1 }}>{k.value}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-5">
        {/* List */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies…" style={{ width: '100%', padding: '8px 12px', border: '1.5px solid t.border', borderRadius: 8, fontFamily: FONT_BODY, fontSize: '0.83rem', outline: 'none', background: t.bg, marginBottom: 10 }} />
          <div style={{ background: t.bg, border: '1px solid #e9ecef', borderRadius: 12, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '24px 14px', textAlign: 'center', fontFamily: FONT_BODY, fontSize: '0.8rem', color: t.textMuted }}>Loading companies…</div>
            ) : loadError ? (
              <div style={{ padding: '24px 14px', textAlign: 'center', fontFamily: FONT_BODY, fontSize: '0.8rem', color: '#ef4444' }}>Couldn't load companies: {loadError}</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '24px 14px', textAlign: 'center', fontFamily: FONT_BODY, fontSize: '0.8rem', color: t.textMuted }}>No companies found</div>
            ) : filtered.map((c, i) => {
              const isSelected = selected?.id === c.id
              return (
                <div key={c.id} onClick={() => setSelected(c)} style={{ padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', background: isSelected ? '#f5f7ff' : t.bg, cursor: 'pointer', borderLeft: `2px solid ${isSelected ? '#6366f1' : 'transparent'}` }}>
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: c.logoBg, color: c.logoColor, fontFamily: FONT_BODY, fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.logo}</span>
                  <div>
                    <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: '0.83rem', color: t.text, lineHeight: 1.2 }}>{c.name}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: '0.7rem', color: t.textMuted }}>{c.industry}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Profile panel */}
        {selected && (
          <div style={{ flex: 1, minWidth: 0, background: t.bg, border: '1px solid #e9ecef', borderRadius: 12, overflow: 'hidden' }}>
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-5" style={{ borderBottom: '1px solid #e9ecef' }}>
              <span style={{ width: 44, height: 44, borderRadius: 10, background: selected.logoBg, color: selected.logoColor, fontFamily: FONT_BODY, fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{selected.logo}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT_CONDENSED, fontWeight: 800, fontSize: '1.4rem', color: t.text, lineHeight: 1 }}>{selected.name}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: '0.78rem', color: t.textMuted, marginTop: 2 }}>{selected.industry} · {selected.location}</div>
              </div>
              <button
                onClick={() => handleDelete(selected.id)}
                disabled={deleting}
                style={{ fontFamily: FONT_BODY, fontSize: '0.75rem', fontWeight: 600, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '7px 12px', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
            {actionError && <p className="px-6 pt-3" style={{ color: '#dc2626', fontSize: '0.75rem', margin: 0 }}>{actionError}</p>}

            <div className="flex gap-0" style={{ borderBottom: '1px solid t.bgAlt' }}>
              {/* Stats */}
              {[
                { label: 'Past Visits', value: selected.pastVisits },
                { label: 'Students Hired', value: selected.studentsHired },
                { label: 'Avg Package', value: selected.avgPackage },
                { label: 'Top Package', value: selected.highestPackage },
                { label: 'Last Visit', value: selected.lastVisit },
              ].map((s, i, arr) => (
                <div key={s.label} className="flex-1 px-5 py-4" style={{ borderRight: i < arr.length - 1 ? '1px solid t.bgAlt' : 'none' }}>
                  <span style={SECTION_LABEL}>{s.label}</span>
                  <div style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.3rem', color: t.text }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* HR Contact */}
            <div className="px-6 py-5" style={{ borderBottom: '1px solid t.bgAlt' }}>
              <span style={SECTION_LABEL}>HR Contact</span>
              <div className="flex items-center gap-3">
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: FONT_BODY, fontSize: '0.72rem', fontWeight: 700, color: '#4f46e5' }}>{selected.hrName.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: '0.88rem', color: t.text }}>{selected.hrName}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: '0.75rem', color: t.textMuted }}>{selected.hrEmail} · {selected.hrPhone}</div>
                </div>
              </div>
            </div>

            {/* Job / package history table */}
            <div className="px-6 py-5">
              <span style={SECTION_LABEL}>Hiring History</span>
              <div style={{ border: '1px solid t.bgAlt', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid t.bgAlt' }}>
                  {['Year', 'Role', 'Hired', 'Package'].map(h => (
                    <span key={h} style={{ fontFamily: FONT_BODY, fontSize: '0.67rem', fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                  ))}
                </div>
                {selected.jobHistory.map((jh, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', padding: '10px 14px', borderBottom: i < selected.jobHistory.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                    <span style={{ fontFamily: FONT_BODY, fontSize: '0.78rem', color: t.textMuted }}>{jh.year}</span>
                    <span style={{ fontFamily: FONT_BODY, fontSize: '0.78rem', color: t.text }}>{jh.role}</span>
                    <span style={{ fontFamily: FONT_BODY, fontSize: '0.78rem', color: t.text, fontWeight: 600 }}>{jh.hired}</span>
                    <span style={{ fontFamily: FONT_DISPLAY, fontSize: '0.78rem', color: t.text, fontWeight: 600 }}>{jh.pkg}</span>
                  </div>
                ))}
              </div>
              <AddJobHistoryForm companyId={selected.id} onAdded={() => loadCompanies(selected.id)} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CommunicationPage
// ─────────────────────────────────────────────────────────────────────────────

function CommunicationPage() {
  const t = useTheme()
  const FONT_CONDENSED = "'Barlow Condensed', sans-serif"
  const FONT_DISPLAY = "'Plus Jakarta Sans', sans-serif"
  const FONT_BODY = "'Inter', sans-serif"
  const SECTION_LABEL: React.CSSProperties = { fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.textMuted, fontFamily: "'Inter', sans-serif", marginBottom: '12px', display: 'block' }

  const [selectedAudience, setSelectedAudience] = React.useState<string[]>(['all'])
  const [channel, setChannel] = React.useState<CommChannel>('Email')
  const [subject, setSubject] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [sent, setSent] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const [sendError, setSendError] = React.useState('')
  const [history, setHistory] = React.useState<SentMessage[]>([])
  const [historyLoading, setHistoryLoading] = React.useState(true)
  const [historyError, setHistoryError] = React.useState('')

  const loadHistory = React.useCallback(() => {
    setHistoryLoading(true)
    api.communication.messages()
      .then(list => { setHistory(list); setHistoryLoading(false) })
      .catch(e => { setHistoryError(e instanceof Error ? e.message : 'Failed to load message history'); setHistoryLoading(false) })
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  const totalRecipients = selectedAudience.includes('all')
    ? 1479
    : [...new Set(selectedAudience)].reduce((s, k) => {
      const opt = AUDIENCE_OPTIONS.find(o => o.key === k)
      return s + (opt?.count ?? 0)
    }, 0)

  const toggleAudience = (key: string) => {
    if (key === 'all') { setSelectedAudience(['all']); return }
    setSelectedAudience(prev => {
      const without = prev.filter(k => k !== 'all' && k !== key)
      return prev.includes(key) ? (without.length ? without : ['all']) : [...without, key]
    })
  }

  const audienceLabel = selectedAudience.includes('all')
    ? 'All Students'
    : selectedAudience.map(k => AUDIENCE_OPTIONS.find(o => o.key === k)?.label ?? k).join(', ')

  async function handleSend() {
    setSendError('')
    setSending(true)
    try {
      await api.communication.send({
        channel,
        audience: audienceLabel,
        subject: channel === 'Email' ? subject : (subject || audienceLabel),
        body: message,
        recipients: totalRecipients,
        status: 'Delivered',
      })
      setSent(true)
      setSubject('')
      setMessage('')
      loadHistory()
      setTimeout(() => setSent(false), 2500)
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ padding: '28px 32px', minHeight: '100%', background: '#f8fafc' }}>
      <div className="mb-5">
        <h1 style={{ fontFamily: FONT_CONDENSED, fontWeight: 800, fontSize: '2rem', color: t.text, letterSpacing: '-0.01em', margin: 0, lineHeight: 1.1 }}>Communication</h1>
        <p style={{ fontFamily: FONT_BODY, fontSize: '0.8rem', color: t.textMuted, marginTop: 4 }}>Broadcast messages to students via email, SMS, WhatsApp, or in-app</p>
      </div>

      <div className="flex gap-5 items-start">
        {/* Composer */}
        <div style={{ flex: '0 0 400px', background: t.bg, border: '1px solid #e9ecef', borderRadius: 12, overflow: 'hidden' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid t.bgAlt' }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: '0.9rem', color: t.text }}>New Broadcast</span>
          </div>

          <div className="px-5 py-5 flex flex-col gap-5">
            {/* Audience */}
            <div>
              <span style={SECTION_LABEL}>Audience</span>
              <div className="flex flex-wrap gap-2">
                {AUDIENCE_OPTIONS.map(opt => {
                  const isSelected = selectedAudience.includes(opt.key)
                  return (
                    <button key={opt.key} onClick={() => toggleAudience(opt.key)} style={{ padding: '4px 12px', borderRadius: 20, border: `1.5px solid ${isSelected ? t.accent : t.border}`, background: isSelected ? '#eef2ff' : t.bg, color: isSelected ? t.accent : t.textMuted, fontFamily: FONT_BODY, fontSize: '0.73rem', fontWeight: isSelected ? 600 : 400, cursor: 'pointer' }}>
                      {opt.label} <span style={{ opacity: 0.6 }}>({opt.count})</span>
                    </button>
                  )
                })}
              </div>
              <div style={{ marginTop: 8, fontFamily: FONT_BODY, fontSize: '0.75rem', color: t.textMuted }}>
                <span style={{ fontWeight: 600, color: t.text }}>{totalRecipients.toLocaleString()}</span> recipients selected
              </div>
            </div>

            {/* Channel */}
            <div>
              <span style={SECTION_LABEL}>Channel</span>
              <div className="flex gap-2">
                {(['Email', 'SMS', 'WhatsApp', 'In-App'] as CommChannel[]).map(ch => {
                  const cs = CHANNEL_STYLE[ch]
                  const isActive = channel === ch
                  return (
                    <button key={ch} onClick={() => setChannel(ch)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1.5px solid ${isActive ? cs.color : t.border}`, background: isActive ? cs.bg : t.bg, color: isActive ? cs.color : t.textMuted, fontFamily: FONT_BODY, fontSize: '0.75rem', fontWeight: isActive ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>{ch}</button>
                  )
                })}
              </div>
            </div>

            {/* Subject (email only) */}
            {channel === 'Email' && (
              <div>
                <span style={SECTION_LABEL}>Subject</span>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Goldman Sachs Drive — Registration Open" style={{ width: '100%', padding: '9px 12px', border: '1.5px solid t.border', borderRadius: 8, fontFamily: FONT_BODY, fontSize: '0.83rem', outline: 'none', background: '#fafafa' }} />
              </div>
            )}

            {/* Message */}
            <div>
              <span style={SECTION_LABEL}>Message</span>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your message here…" rows={5} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid t.border', borderRadius: 8, fontFamily: FONT_BODY, fontSize: '0.83rem', outline: 'none', background: '#fafafa', resize: 'vertical' }} />
            </div>

            {/* Send */}
            <button onClick={handleSend} disabled={sending} style={{ width: '100%', padding: '11px', background: sent ? '#22c55e' : t.accent, border: 'none', borderRadius: 9, color: t.bg, fontFamily: FONT_BODY, fontWeight: 700, fontSize: '0.88rem', cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1, transition: 'background 0.3s' }}>
              {sending ? 'Sending…' : sent ? '✓ Message Sent' : `Send to ${totalRecipients.toLocaleString()} recipients`}
            </button>
            {sendError && <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: 0 }}>{sendError}</p>}
          </div>
        </div>

        {/* Sent history */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: '0.9rem', color: t.text, marginBottom: 12 }}>Sent History</div>
          {historyLoading ? (
            <p style={{ fontFamily: FONT_BODY, fontSize: '0.8rem', color: t.textMuted }}>Loading history…</p>
          ) : historyError ? (
            <p style={{ fontFamily: FONT_BODY, fontSize: '0.8rem', color: '#dc2626' }}>Couldn't load history: {historyError}</p>
          ) : history.length === 0 ? (
            <p style={{ fontFamily: FONT_BODY, fontSize: '0.8rem', color: t.textMuted }}>No messages sent yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {history.map(msg => {
                const cs = CHANNEL_STYLE[msg.channel]
                const st = COMM_STATUS_STYLE[msg.status]
                return (
                  <div key={msg.id} style={{ background: t.bg, border: '1px solid #e9ecef', borderRadius: 10, padding: '14px 16px' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontFamily: FONT_BODY, fontSize: '0.7rem', fontWeight: 700, color: cs.color, background: cs.bg, padding: '2px 9px', borderRadius: 20 }}>{msg.channel}</span>
                          <span style={{ fontFamily: FONT_BODY, fontSize: '0.72rem', color: t.textMuted }}>{msg.audience}</span>
                        </div>
                        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: '0.85rem', color: t.text, lineHeight: 1.3 }}>{msg.subject}</div>
                      </div>
                      <div className="text-right" style={{ flexShrink: 0 }}>
                        <div style={{ display: 'inline-block', borderLeft: `2px solid ${st.accent}`, paddingLeft: 8, color: st.color, fontWeight: 600, fontSize: '0.72rem', fontFamily: FONT_BODY }}>{msg.status}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span style={{ fontFamily: FONT_BODY, fontSize: '0.72rem', color: t.textMuted }}>{msg.sentAt}</span>
                      <span style={{ fontFamily: FONT_BODY, fontSize: '0.72rem', color: t.textMuted }}><span style={{ fontWeight: 600, color: t.text }}>{msg.recipients.toLocaleString()}</span> recipients</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// UsersPage — placement-officer-only account management
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  placement_officer: 'Placement Officer',
  placement_coordinator: 'Placement Coordinator',
  department_coordinator: 'Department Coordinator',
  student: 'Student',
  recruiter: 'Recruiter',
}
const ROLE_OPTIONS = Object.keys(ROLE_LABELS)

interface AppUser { id: number; fullName: string; email: string; role: string; institution: string; isActive: boolean }

function UsersPage() {
  const t = useTheme()
  const FONT_CONDENSED = "'Barlow Condensed', sans-serif"
  const FONT_DISPLAY = "'Plus Jakarta Sans', sans-serif"
  const FONT_BODY = "'Inter', sans-serif"

  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [rowError, setRowError] = useState<{ id: number; message: string } | null>(null)
  const currentUser = api.getStoredUser()

  const loadUsers = React.useCallback(() => {
    setLoading(true)
    setLoadError('')
    api.users.list()
      .then(list => { setUsers(list); setLoading(false) })
      .catch(e => { setLoadError(e instanceof Error ? e.message : 'Failed to load users'); setLoading(false) })
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleRoleChange(u: AppUser, role: string) {
    setBusyId(u.id)
    setRowError(null)
    try {
      await api.users.update(u.id, { role })
      loadUsers()
    } catch (err) {
      setRowError({ id: u.id, message: err instanceof Error ? err.message : 'Failed to update role' })
    } finally {
      setBusyId(null)
    }
  }

  async function handleToggleActive(u: AppUser) {
    setBusyId(u.id)
    setRowError(null)
    try {
      await api.users.update(u.id, { is_active: !u.isActive })
      loadUsers()
    } catch (err) {
      setRowError({ id: u.id, message: err instanceof Error ? err.message : 'Failed to update status' })
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(u: AppUser) {
    if (!window.confirm(`Delete ${u.fullName}'s account? This can't be undone.`)) return
    setBusyId(u.id)
    setRowError(null)
    try {
      await api.users.delete(u.id)
      loadUsers()
    } catch (err) {
      setRowError({ id: u.id, message: err instanceof Error ? err.message : 'Failed to delete user' })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div style={{ padding: '28px 32px', minHeight: '100%', background: '#f8fafc' }}>
      <div className="mb-5">
        <h1 style={{ fontFamily: FONT_CONDENSED, fontWeight: 800, fontSize: '2rem', color: t.text, letterSpacing: '-0.01em', margin: 0, lineHeight: 1.1 }}>User Management</h1>
        <p style={{ fontFamily: FONT_BODY, fontSize: '0.8rem', color: t.textMuted, marginTop: 4 }}>Manage every account's role and access — visible to Placement Officers only</p>
      </div>

      <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3" style={{ background: t.bg, border: '1px solid #e9ecef' }}>
        <Search size={13} style={{ color: t.textMuted, flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-xs outline-none"
          style={{ background: 'transparent', color: t.text, fontFamily: FONT_BODY }}
        />
      </div>

      <div style={{ background: t.bg, border: '1px solid #e9ecef', borderRadius: 12, overflow: 'hidden' }}>
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #e9ecef' }}>
          <p className="text-xs" style={{ color: t.textMuted }}>
            {loading ? 'Loading…' : <>Showing <span style={{ color: t.text, fontWeight: 600 }}>{filtered.length}</span> of {users.length} accounts</>}
          </p>
        </div>

        {loading ? (
          <div className="px-5 py-12 text-center"><p className="text-sm" style={{ color: t.textMuted }}>Loading users…</p></div>
        ) : loadError ? (
          <div className="px-5 py-12 text-center"><p className="text-sm" style={{ color: '#ef4444' }}>Couldn't load users: {loadError}</p></div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-12 text-center"><p className="text-sm" style={{ color: t.textMuted }}>No accounts match your search.</p></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #e9ecef' }}>
                {['Name', 'Email', 'Role', 'Institution', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3" style={{ fontSize: '0.68rem', fontWeight: 600, color: t.textMuted, fontFamily: FONT_BODY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <React.Fragment key={u.id}>
                  <tr style={{ borderBottom: i < filtered.length - 1 && !(rowError?.id === u.id) ? '1px solid #f8fafc' : 'none' }}>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold" style={{ color: t.text, fontFamily: FONT_DISPLAY }}>{u.fullName}</span>
                      {u.id === currentUser?.id && <span className="ml-2 text-xs" style={{ color: t.textMuted }}>(you)</span>}
                    </td>
                    <td className="px-5 py-3.5"><span className="text-xs" style={{ color: t.textMuted }}>{u.email}</span></td>
                    <td className="px-5 py-3.5">
                      <select
                        value={u.role}
                        disabled={busyId === u.id}
                        onChange={e => handleRoleChange(u, e.target.value)}
                        className="text-xs rounded-lg outline-none px-2 py-1.5"
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: t.text }}
                      >
                        {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3.5"><span className="text-xs" style={{ color: t.textMuted }}>{u.institution || '—'}</span></td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={busyId === u.id}
                        style={{
                          display: 'inline-block', borderLeft: `2px solid ${u.isActive ? '#22c55e' : '#94a3b8'}`, paddingLeft: 8,
                          color: u.isActive ? '#15803d' : '#64748b', fontWeight: 600, fontSize: '0.75rem', background: 'none', border: 'none', borderLeftWidth: 2, borderLeftStyle: 'solid', cursor: 'pointer',
                        }}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={busyId === u.id || u.id === currentUser?.id}
                        className="text-xs font-medium"
                        style={{ color: u.id === currentUser?.id ? '#cbd5e1' : '#ef4444', cursor: u.id === currentUser?.id ? 'not-allowed' : 'pointer', background: 'none', border: 'none' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {rowError?.id === u.id && (
                    <tr style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                      <td colSpan={6} className="px-5 pb-3">
                        <p style={{ color: '#dc2626', fontSize: '0.72rem', margin: 0 }}>{rowError.message}</p>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter select
// ─────────────────────────────────────────────────────────────────────────────

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: readonly string[] }) {
  const t = useTheme()
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none text-xs font-medium pl-3 pr-7 py-2 rounded-lg outline-none cursor-pointer transition-colors"
        style={{ background: '#f8fafc', border: '1px solid t.border', color: t.text, fontFamily: FONT_DISPLAY }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.textMuted }} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Student modal
// ─────────────────────────────────────────────────────────────────────────────

function AddStudentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const t = useTheme()
  const [form, setForm] = useState({ name: '', roll: '', department: '', batch: '', email: '', cgpa: '', status: 'Eligible' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const isValid = form.name.trim() && form.roll.trim() && form.email.trim()
    && form.department !== '' && form.department !== 'All Departments'
    && form.batch !== '' && form.batch !== 'All Batches'

  async function handleSubmit() {
    if (!isValid) {
      setError('Please fill in name, roll number, email, department, and batch.')
      return
    }
    setError('')
    setSaving(true)
    try {
      await api.students.create({
        name: form.name.trim(),
        roll: form.roll.trim(),
        department: form.department,
        batch: form.batch,
        email: form.email.trim(),
        cgpa: form.cgpa ? Number(form.cgpa) : undefined,
        status: form.status,
      })
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add student')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ background: t.bg }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid t.bgAlt' }}>
          <div>
            <h3 style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.25rem', color: t.text }}>Add New Student</h3>
            <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>Fill in the student details below</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors" style={{ color: t.textMuted }}>
            <X size={15} />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          {[
            { label: 'Full Name', key: 'name', placeholder: 'e.g. Priya Sharma', type: 'text' },
            { label: 'Roll Number', key: 'roll', placeholder: 'e.g. CS21B042', type: 'text' },
            { label: 'Email', key: 'email', placeholder: 'e.g. priya.sharma@iith.ac.in', type: 'email' },
            { label: 'CGPA', key: 'cgpa', placeholder: 'e.g. 8.6', type: 'number' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#475569', fontFamily: FONT_DISPLAY }}>{f.label}</label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                value={(form as Record<string, string>)[f.key]}
                onChange={set(f.key)}
                className="w-full px-3.5 py-2.5 text-xs rounded-lg outline-none"
                style={{ background: '#f8fafc', border: '1px solid t.border', color: t.text }}
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#475569', fontFamily: FONT_DISPLAY }}>Department</label>
              <FilterSelect value={form.department || 'All Departments'} onChange={v => setForm(f => ({ ...f, department: v }))} options={DEPARTMENTS} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#475569', fontFamily: FONT_DISPLAY }}>Batch</label>
              <FilterSelect value={form.batch || 'All Batches'} onChange={v => setForm(f => ({ ...f, batch: v }))} options={BATCHES} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#475569', fontFamily: FONT_DISPLAY }}>Placement Status</label>
            <FilterSelect value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={['Eligible', 'Applied', 'Interviewing', 'Offered', 'Placed']} />
          </div>
          {error && <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: 0 }}>{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid t.bgAlt' }}>
          <button onClick={onClose} className="text-xs font-medium px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors" style={{ color: t.textMuted, border: '1px solid t.border' }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="text-xs font-semibold px-5 py-2.5 rounded-lg transition-all hover:opacity-90"
            style={{ background: '#0b1120', color: t.bg, fontFamily: FONT_DISPLAY, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? 'Adding…' : 'Add Student'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth page — Login / Sign Up
// ─────────────────────────────────────────────────────────────────────────────

const AUTH_ROLES = [
  { value: '', label: 'Select your role' },
  { value: 'placement_officer', label: 'Placement Officer' },
  { value: 'placement_coordinator', label: 'Placement Coordinator' },
  { value: 'department_coordinator', label: 'Department Coordinator' },
  { value: 'student', label: 'Student' },
  { value: 'recruiter', label: 'Recruiter' },
]

function AuthPage({ onLogin, darkMode, setDarkMode }: { onLogin: () => void; darkMode: boolean; setDarkMode: (v: boolean) => void }) {
  const t = useTheme()
  const [tab, setTab] = useState<'login' | 'signup'>('login')

  return (
    <div className="min-h-screen flex" style={{ fontFamily: FONT_BODY, position: 'relative' }}>

      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[44%] relative overflow-hidden"
        style={{ background: '#080e1c' }}
      >

        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(t.bg 1px, transparent 1px), linear-gradient(90deg, t.bg 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        {/* Glow */}
        <div className="absolute bottom-0 left-0 w-96 h-96 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', transform: 'translate(-20%, 20%)' }} />

        {/* Logo */}
        <div className="relative z-10 px-10 pt-10 flex items-center gap-3">
          <img
            src={hustleGradLogo}
            alt="HustleGrad"
            style={{ width: 36, height: 36, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />
          <span style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.375rem', color: t.bg, letterSpacing: '0.04em' }}>HustleGrad</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 px-10 py-12">
          <p className="text-xs font-medium mb-8" style={{ color: '#4b5563', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Campus Placement Management
          </p>
          <h1 style={{ fontFamily: FONT_CONDENSED, fontWeight: 800, fontSize: '3rem', color: t.bg, letterSpacing: '0.01em', lineHeight: 1.05 }}>
            Streamline your<br />
            <span style={{ color: '#818cf8' }}>campus placements</span><br />
            end-to-end.
          </h1>
          <p className="text-sm leading-relaxed mt-6 max-w-xs" style={{ color: '#4b5563' }}>
            One platform connecting placement officers, coordinators, students,
            and recruiters — from drive scheduling to offer management.
          </p>

          {/* Stats */}
          <div className="flex gap-10 mt-10">
            {[{ value: '2,400+', label: 'Universities' }, { value: '180K+', label: 'Placements' }, { value: '98%', label: 'Satisfaction' }].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.75rem', color: t.bg }}>{s.value}</div>
                <div className="text-xs mt-0.5" style={{ color: '#374151', letterSpacing: '0.03em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 mx-10 mb-10 px-5 py-5" style={{ borderLeft: '2px solid rgba(129,140,248,0.4)' }}>
          <p className="text-sm leading-relaxed" style={{ color: '#6b7280', fontStyle: 'italic' }}>
            "HustleGrad reduced our placement cycle from 6 weeks to under 10 days.
            The coordinator dashboard alone saves us 20 hours per drive."
          </p>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ background: t.accent }}>AR</div>
            <div>
              <div className="text-xs font-medium" style={{ color: '#9ca3af' }}>Ananya Rao</div>
              <div className="text-xs" style={{ color: '#4b5563' }}>Head of Placements, IIT Hyderabad</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10" style={{ background: t.bg, position: 'relative' }}>
        <div className="w-full max-w-md">

          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              zIndex: 10,
              width: 36,
              height: 36,
              borderRadius: 8,
              border: `1px solid ${t.border}`,
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {darkMode ? <Sun size={16} style={{ color: t.textMuted }} /> : <Moon size={16} style={{ color: t.textMuted }} />}
          </button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <img
              src={hustleGradLogo}
              alt="HustleGrad"
              style={{ width: 28, height: 28, objectFit: 'contain' }}
            />
            <span style={{ fontFamily: FONT_CONDENSED, fontWeight: 700, fontSize: '1.25rem', color: '#0b1120', letterSpacing: '0.04em' }}>HustleGrad</span>
          </div>

          {/* Tab toggle — underline style */}
          <div className="flex gap-6 mb-8" style={{ borderBottom: '2px solid t.bgAlt' }}>
            {(['login', 'signup'] as const).map(tabkey => (
              <button
                key={tabkey}
                onClick={() => setTab(tabkey)}
                className="pb-3 text-sm transition-all"
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontWeight: tab === tabkey ? 600 : 400,
                  color: tab === tabkey ? t.text : t.textMuted,
                  borderBottom: tab === tabkey ? '2px solid t.accent' : '2px solid transparent',
                  marginBottom: '-2px',
                }}
              >
                {tabkey === 'login' ? 'Log In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h2 style={{ fontFamily: FONT_CONDENSED, fontWeight: 800, fontSize: '2.25rem', color: '#0b1120', letterSpacing: '0.01em', lineHeight: 1 }}>
              {tab === 'login' ? 'Welcome back' : 'Get started today'}
            </h2>
            <p className="text-sm mt-2" style={{ color: t.textMuted }}>
              {tab === 'login' ? 'Sign in to your HustleGrad workspace.' : 'Set up your institution account in minutes.'}
            </p>
          </div>

          {tab === 'login'
            ? <AuthLoginForm onLogin={onLogin} />
            : <AuthSignupForm onLogin={onLogin} />}

          <p className="text-center text-xs mt-8" style={{ color: t.textMuted }}>
            By continuing you agree to our{' '}
            <a href="#" className="underline" style={{ color: t.accent }}>Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="underline" style={{ color: t.accent }}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Auth form shared styles ───────────────────────────────────────────────────

const authInputStyle: React.CSSProperties = {
  background: '#f8fafc',
  border: '1px solid t.border',
  color: '#334155',
  fontFamily: FONT_BODY,
}

function AuthField({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  const t = useTheme()
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-medium mb-1.5" style={{ color: '#475569', fontFamily: FONT_DISPLAY, letterSpacing: '0.01em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function AuthRoleSelect({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const t = useTheme()
  return (
    <div className="relative">
      <select
        id={id} required value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none appearance-none transition-all pr-9"
        style={{ ...authInputStyle, color: value ? t.text : t.textMuted }}
      >
        {AUTH_ROLES.map(r => (
          <option key={r.value} value={r.value} disabled={r.value === ''} style={{ color: t.text }}>{r.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.textMuted }} />
    </div>
  )
}

function AuthPasswordStrength({ password }: { password: string }) {
  const t = useTheme()
  const score = Math.min(
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0), 4
  )
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e']
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300" style={{ background: i <= score ? colors[score - 1] : t.border }} />
        ))}
      </div>
      {score > 0 && <span className="text-xs" style={{ color: colors[score - 1] }}>{labels[score - 1]}</span>}
    </div>
  )
}

// ── Login form ────────────────────────────────────────────────────────────────

function AuthLoginForm({ onLogin }: { onLogin: () => void }) {
  const t = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [institutionError, setInstitutionError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setInstitutionError('')
    setLoading(true)
    try {
      await api.auth.login({ email, password, role })
      onLogin()
    } catch (err) {
      setInstitutionError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <AuthField label="Work email" htmlFor="l-email">
        <input id="l-email" type="email" required autoComplete="email" placeholder="you@university.edu"
          value={email} onChange={e => setEmail(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition-all"
          style={authInputStyle}
        />
      </AuthField>

      <AuthField label="Password" htmlFor="l-password">
        <div className="relative">
          <input id="l-password" type={showPw ? 'text' : 'password'} required autoComplete="current-password" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition-all pr-10"
            style={authInputStyle}
          />
          <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }}>
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <div className="flex justify-end mt-1.5">
          {forgotSent
            ? <span className="text-xs" style={{ color: t.accent }}>Reset link sent — check your inbox.</span>
            : <button type="button" onClick={() => setForgotSent(true)} className="text-xs font-medium" style={{ color: t.accent }}>Forgot password?</button>}
        </div>
      </AuthField>

      <AuthField label="Role" htmlFor="l-role">
        <AuthRoleSelect id="l-role" value={role} onChange={setRole} />
      </AuthField>

      {institutionError && (
        <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '-8px' }}>{institutionError}</p>
      )}

      <button
        type="submit"
        disabled={!email || !password || !role || loading}
        className="w-full py-3 text-sm font-semibold rounded-lg mt-1 transition-all duration-150 flex items-center justify-center gap-2"
        style={{ fontFamily: FONT_DISPLAY, background: email && password && role ? '#0b1120' : '#cbd5e1', color: t.bg, cursor: email && password && role && !loading ? 'pointer' : 'not-allowed', letterSpacing: '-0.01em' }}
      >
        {loading
          ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Signing in…</>
          : 'Log In'}
      </button>
    </form>
  )
}

// ── Signup form ───────────────────────────────────────────────────────────────

function AuthSignupForm({ onLogin }: { onLogin: () => void }) {
  const t = useTheme()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [institution, setInstitution] = useState('')
  const [role, setRole] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [signupError, setSignupError] = useState('')

  const allFilled = name && email && password && institution && role

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSignupError('')
    setLoading(true)
    try {
      await api.auth.signup({ full_name: name, email, password, institution, role })
      onLogin()
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : 'Signup failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <AuthField label="Full name" htmlFor="s-name">
        <input id="s-name" type="text" required autoComplete="name" placeholder="Priya Sharma"
          value={name} onChange={e => setName(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition-all"
          style={authInputStyle}
        />
      </AuthField>

      <AuthField label="Work email" htmlFor="s-email">
        <input id="s-email" type="email" required autoComplete="email" placeholder="you@university.edu"
          value={email} onChange={e => setEmail(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition-all"
          style={authInputStyle}
        />
      </AuthField>

      <AuthField label="Institution / University" htmlFor="s-institution">
        <input id="s-institution" type="text" required placeholder="e.g. IIT Bombay, VIT Vellore"
          value={institution} onChange={e => setInstitution(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition-all"
          style={authInputStyle}
        />
      </AuthField>

      <AuthField label="Role" htmlFor="s-role">
        <AuthRoleSelect id="s-role" value={role} onChange={setRole} />
      </AuthField>

      <AuthField label="Password" htmlFor="s-password">
        <div className="relative">
          <input id="s-password" type={showPw ? 'text' : 'password'} required autoComplete="new-password" placeholder="Min. 8 characters"
            value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition-all pr-10"
            style={authInputStyle}
          />
          <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }}>
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {password.length > 0 && <AuthPasswordStrength password={password} />}
      </AuthField>

      {signupError && (
        <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '-8px' }}>{signupError}</p>
      )}

      <button
        type="submit"
        disabled={!allFilled || loading}
        className="w-full py-3 text-sm font-semibold rounded-lg mt-1 transition-all duration-150 flex items-center justify-center gap-2"
        style={{ fontFamily: FONT_DISPLAY, background: allFilled ? '#0b1120' : '#cbd5e1', color: t.bg, cursor: allFilled && !loading ? 'pointer' : 'not-allowed', letterSpacing: '-0.01em' }}
      >
        {loading
          ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Creating account…</>
          : 'Create Account'}
      </button>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<'auth' | 'app'>(() => (api.isAuthenticated() ? 'app' : 'auth'))
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  function handleLogout() {
    api.logout()
    setPage('auth')
  }

  return (
    <ThemeContext.Provider value={theme(darkMode)}>
      {page === 'auth'
        ? <AuthPage onLogin={() => setPage('app')} darkMode={darkMode} setDarkMode={setDarkMode} />
        : <AppShell darkMode={darkMode} setDarkMode={setDarkMode} onLogout={handleLogout} />}
    </ThemeContext.Provider>
  )
}
