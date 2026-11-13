# FixTrack — Smart Campus Maintenance & Repair Management System

> **Report. Repair. Resolve.**  
> A full-stack campus maintenance operations platform that catches duplicate complaints, routes repairs to specialized technicians, and tracks repair accountability through to verified closure.

---

## 🚀 Live Connections & Services

- **GitHub Repository**: [https://github.com/Nifu-smh/fixtrack](https://github.com/Nifu-smh/fixtrack)
- **Supabase Backend Project**: `fixtrack` (Region: `ap-south-1`)
  - Project URL: `https://mrrcwwyqoscsityitzir.supabase.co`
  - Authentication: Supabase Auth (Email + Password, Google / Gmail OAuth)
  - Database: PostgreSQL 17 with Row Level Security (RLS) & Realtime Synchronization
- **Vercel Deployment**: Configured via `vercel.json` with SPA Edge routing

---

## 🔑 Real Pre-Configured Test Accounts (in Supabase Auth)

The system is seeded with real authenticated campus accounts in Supabase Auth & PostgreSQL `profiles` table. Any of these can be used immediately:

| Role | Name | Email | Password | Responsibility |
| --- | --- | --- | --- | --- |
| **Maintenance Admin** | Campus Admin | `admin@fixtrack.campus` | `FixTrack@2026` | Triage duplicate reports, assign technicians, prioritize cases, verify & close repairs, analytics |
| **Technician (IT)** | Arjun Menon | `arjun.tech@fixtrack.campus` | `FixTrack@2026` | View assigned IT work orders, start repair, submit completion note |
| **Technician (Electrical)** | Faisal Rahman | `faisal.tech@fixtrack.campus` | `FixTrack@2026` | Electrical repairs, fan and power outages |
| **Technician (Plumbing)** | Anjali Nair | `anjali.tech@fixtrack.campus` | `FixTrack@2026` | Plumbing leaks and washbasin repairs |
| **Student / Reporter** | Nifu (Student Reporter) | `student@fixtrack.campus` | `FixTrack@2026` | Submit complaints, track status, verify completed fixes |

> **Google / Gmail Sign-In**: Users can also click **"Continue with Google / Gmail"** on `/login` to sign in using their Google account. An auto-provisioning database trigger creates a profile in `public.profiles` with the `reporter` role automatically.

---

## 🏛 Database Schema (Supabase PostgreSQL)

All operational data is persisted in Supabase with RLS policies:

1. `profiles`: `id` (references `auth.users`), `email`, `name`, `role` (`admin` | `technician` | `reporter`), `department`, `phone`, `skill`, `available`, `initials`, `color`.
2. `locations`: `id`, `building`, `room`, `floor` (Pre-seeded with Computer Labs 1 & 2, Library, Boys Hostel, Classroom 204, Cafeteria, Auditorium, Admin Office).
3. `assets`: `id`, `name`, `category`, `location_id`, `health` (Pre-seeded with Dell OptiPlex PC-14, HP ProDesk PC-08, Epson Projector PRJ-04, Daikin AC-02, Fan FAN-06, etc.).
4. `maintenance_cases`: `id` (e.g. `FIX-001`), `title`, `description`, `category`, `issue_type`, `asset_id`, `location_id`, `priority`, `status`, `assigned_to`, `repair_note`, `created_at`, `updated_at`.
5. `issue_reports`: `id` (e.g. `RPT-001`), `title`, `description`, `category`, `issue_type`, `asset_id`, `location_id`, `reporter_id`, `reporter_name`, `case_id`, `triaged`, `safety`, `photo_url`, `created_at`.
6. `case_updates`: `id`, `case_id`, `actor_id`, `actor_name`, `action`, `note`, `created_at` (Full audit timeline).
7. `campus_settings`: Campus name, SLA response thresholds, emergency safety contacts.

---

## ⚡ Core Technical Workflows

### 1. Duplicate Detection Engine
- **Strong Match**: Same Asset ID (`PC-14`) + Same Issue Type (`Display failure`) -> Suggests linking to existing active case (e.g. `#FIX-001`).
- **Different Fault on Same Asset**: Same Asset ID (`PC-14`) + Different Issue Type (`Keyboard failure`) -> Kept as a separate case.
- **Location-based Match**: When no Asset ID is given, matches based on Room + Category + Issue Type + semantic description overlap.
- **Human Verification**: Potential duplicates are suggested to the admin; original reports are never lost or deleted when linked.

### 2. Status Lifecycle & Accountability
```
[New] ──> [Triaged] ──> [Assigned] ──> [In Progress] ──> [Resolved] ──> [Closed]
                                                               │            ▲
                                                               └──[Reopened]┘
```
- **Assigned -> In Progress**: Only the assigned technician (or admin) can start the job.
- **In Progress -> Resolved**: Technician marks repair complete with a mandatory repair note describing the fix and test evidence.
- **Resolved -> Closed**: Admin or the student reporter verifies the physical repair and closes the loop.
- **Resolved -> Reopened**: If the fault persists, it is reopened with explanation notes for the technician.

---

## 🛠 Local Development & Testing

```sh
# Start local development server (http://127.0.0.1:4173)
npm run dev

# Run all 45 automated domain & integration tests
npm test

# Check JavaScript syntax
npm run check

# Build single-file portable offline bundle (FixTrack.html)
npm run build
```

---

## 🌐 Deploy to Vercel

1. Import git repository: `https://github.com/Nifu-smh/fixtrack` in the [Vercel Dashboard](https://vercel.com/new).
2. Configure Environment Variables in Vercel:
   - `SUPABASE_URL`: `https://mrrcwwyqoscsityitzir.supabase.co`
   - `SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - `SUPABASE_PUBLISHABLE_KEY`: `sb_publishable_RIk1NNNbxPgaCRakDdugiA_lhqhCqKn`
3. Click **Deploy**. Vercel will build and serve with zero additional configuration using `vercel.json` rewrites.
