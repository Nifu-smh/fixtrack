# FixTrack

A complete local website based on the FixTrack campus maintenance blueprint.

## Open the website

Double-click **FixTrack.html** or **Start-FixTrack.cmd**. No installation, account, internet connection or development server is required. Start at the homepage, select **Explore FixTrack**, and choose a portal. Use the profile menu at the bottom of the sidebar to switch roles.

Direct views in the portable file use hash navigation: `FixTrack.html#/admin`, `FixTrack.html#/dashboard`, and `FixTrack.html#/technician`.

The website includes sample data and saves changes in this browser's local storage. An offline preview is not authenticated: selecting a role demonstrates its workflow and does not enforce permissions. Nothing in this version sends reports online. Do not enter sensitive information into this demonstration.

## Complete page structure

| Portal | Page | Source route |
| --- | --- | --- |
| Public | Homepage | `/` |
| Public | Login / local role selection | `/login` |
| Reporter | Dashboard | `/dashboard` |
| Reporter | Report issue: location, details, review | `/report/new` |
| Reporter | My reports | `/my-reports` |
| Reporter | Report details | `/my-reports/:id` |
| Shared | Campus issue directory | `/issues` |
| Shared | Campus issue and repair details | `/issues/:id` |
| Shared | Profile | `/profile` |
| Shared | Notifications | `/notifications` |
| Shared | Help centre | `/help` |
| Technician | My assigned jobs | `/technician` |
| Technician | Work order details and repair updates | `/technician/jobs/:id` |
| Technician | Completed repair history | `/technician/history` |
| Admin | Maintenance overview | `/admin` |
| Admin | Incoming reports and triage | `/admin/reports` |
| Admin | Report review / duplicate confirmation | `/admin/reports/:id` |
| Admin | All maintenance cases | `/admin/cases` |
| Admin | Case detail, assignment and verification | `/admin/cases/:id` |
| Admin | Technician directory and workload | `/admin/technicians` |
| Admin | Locations and asset directory | `/admin/assets` |
| Admin | Reports and analytics | `/admin/analytics` |
| Admin | Campus, notification and workflow settings | `/admin/settings` |
| Shared | Missing page or record | Fallback |

## Working local features

- Three responsive portals with shared navigation, mobile menu, keyboard search, profile, help and notifications.
- Three-step issue reporting with required fields, safety flag and optional image (PNG/JPEG/WebP, up to 1 MB).
- Duplicate suggestions based on asset plus fault type; without an asset, room/category/type and description overlap are required. Suggestions do not merge automatically.
- Admin confirms links or creates distinct cases. Original reports are preserved.
- Assignment to available technicians, priority changes, progress notes, completed repair notes, verification and reopening.
- All linked reports read status from their shared case.
- Status and category filtering, search, table/card views, CSV exports, local workspace JSON backup and confirmed demo reset.
- Technician availability, additional team records, additional asset records and per-asset repair histories.
- Dashboard and analytics numbers derive from the current dataset. The two activity periods use report and completion timestamps.
- All pages work without external libraries, remote fonts, images, or API requests.

## Try the full workflow

1. In **Student / staff**, report a display failure for `PC-14` in Academic Block / Computer Lab 1.
2. Switch to **Maintenance admin** and open Incoming reports. The new report should suggest `FIX-001` as a strong match.
3. Confirm the link. The original report remains in My reports.
4. Report a **keyboard failure** for `PC-14`. It should not suggest the display-failure case. Create a separate case and assign it to Arjun Menon.
5. Switch to **Maintenance technician**, open that case, start repair, then mark complete with a repair note.
6. Switch to the reporter or admin. Verify and close the repair, or reopen it with a reason.
7. Refresh. The case, linked reports and timeline should retain the changes.

`FIX-004` starts in the awaiting-verification state. `RPT-013` starts as a duplicate suggestion; `RPT-015` is a different fault on the same asset.

## Edit the source

Node.js 20+ is sufficient; no package installation is needed.

```sh
npm run dev
# http://127.0.0.1:4173

npm run check
npm test
npm run build
```

| File | Purpose |
| --- | --- |
| `app.js` | All pages, components, navigation and local interactions |
| `styles.css` | Responsive teal, ivory and sage visual system |
| `domain.js` | Matching, linking, status rules, derived metrics, safe export |
| `data.js` | Fictional demo issues, equipment, technicians and locations |
| `server.mjs` | Optional loopback-only development server with SPA fallback |
| `build.mjs` | Produces the single portable `FixTrack.html` |
| `tests/` | Domain, route-render and local workflow checks |

After editing source files, run `npm run build` to update the portable HTML file. Use the loopback development server for the most consistent local-storage behavior; file-origin persistence can vary with browser settings.

## Deferred online integration

As requested, this deliverable is local and has not been published or pushed to GitHub. No Google authentication or shared cloud database is wired into the local website. A separate Supabase project named `fixtrack` was provisioned before the local-only instruction; it has no application schema or data from this build.

Before online use, implement Supabase Auth and database tables, server-enforced roles and RLS, private attachment storage, real account invitations, configured campus emergency contacts, and deployment configuration. The role switcher must stay limited to an isolated demo and cannot serve as production authorization.

Browser screenshots and visual interaction verification were blocked by the local computer-control service. Automated checks validate page rendering and workflow logic, not real browser layout.
