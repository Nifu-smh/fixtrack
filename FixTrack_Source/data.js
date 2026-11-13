export const locations = [
  { id: 'lab1', building: 'Academic Block', room: 'Computer Lab 1', floor: 'Ground floor' },
  { id: 'lab2', building: 'Academic Block', room: 'Computer Lab 2', floor: 'First floor' },
  { id: 'library', building: 'Library', room: 'Reading Hall', floor: 'Ground floor' },
  { id: 'hostel', building: 'Boys Hostel', room: 'Washroom · Wing B', floor: 'Second floor' },
  { id: 'class', building: 'Academic Block', room: 'Classroom 204', floor: 'Second floor' },
  { id: 'canteen', building: 'Student Centre', room: 'Cafeteria', floor: 'Ground floor' },
  { id: 'auditorium', building: 'Main Building', room: 'Auditorium', floor: 'Ground floor' },
  { id: 'office', building: 'Main Building', room: 'Admin Office', floor: 'First floor' }
];

export const categories = [
  'Computer / IT',
  'Electrical',
  'Plumbing',
  'Furniture',
  'Cleaning',
  'Internet',
  'Building maintenance',
  'Other'
];

export const issueTypes = {
  'Computer / IT': ['Display failure', 'Keyboard failure', 'System not starting', 'Other IT issue'],
  'Electrical': ['Fan not working', 'Exposed wiring', 'Light not working', 'Power outage'],
  'Plumbing': ['Water leak', 'Blocked drain', 'Tap not working'],
  'Furniture': ['Broken chair', 'Damaged desk', 'Other damage'],
  'Cleaning': ['Cleaning needed', 'Waste collection'],
  'Internet': ['No connection', 'Slow connection'],
  'Building maintenance': ['Structural damage', 'Door or window repair'],
  'Other': ['Other issue']
};

export const technicians = [
  { id: 'tech-1', uuid: 'a0000000-0000-0000-0000-000000000002', name: 'Arjun Menon', initials: 'AM', skill: 'Computer / IT', color: 'blue', email: 'arjun.tech@fixtrack.campus', available: true },
  { id: 'tech-2', uuid: 'a0000000-0000-0000-0000-000000000003', name: 'Faisal Rahman', initials: 'FR', skill: 'Electrical', color: 'orange', email: 'faisal.tech@fixtrack.campus', available: true },
  { id: 'tech-3', uuid: 'a0000000-0000-0000-0000-000000000004', name: 'Anjali Nair', initials: 'AN', skill: 'Plumbing', color: 'purple', email: 'anjali.tech@fixtrack.campus', available: true },
  { id: 'tech-4', uuid: 'a0000000-0000-0000-0000-000000000004', name: 'Vinod Kumar', initials: 'VK', skill: 'Furniture', color: 'green', email: 'vinod.tech@fixtrack.campus', available: false }
];

export const assets = [
  { id: 'PC-14', name: 'Dell OptiPlex 7090', category: 'Computer / IT', location: 'lab1', health: 62 },
  { id: 'PC-08', name: 'HP ProDesk 400', category: 'Computer / IT', location: 'lab2', health: 93 },
  { id: 'FAN-06', name: 'Ceiling fan · North wing', category: 'Electrical', location: 'library', health: 78 },
  { id: 'TAP-B2', name: 'Washbasin tap', category: 'Plumbing', location: 'hostel', health: 48 },
  { id: 'PRJ-04', name: 'Epson classroom projector', category: 'Computer / IT', location: 'class', health: 86 },
  { id: 'AC-02', name: 'Daikin split air conditioner', category: 'Electrical', location: 'office', health: 95 },
  { id: 'DESK-12', name: 'Study desk', category: 'Furniture', location: 'library', health: 91 },
  { id: 'RTR-01', name: 'Campus Wi-Fi router', category: 'Internet', location: 'lab1', health: 72 }
];

export function seed() {
  const now = new Date();
  const ago = (h) => new Date(now - h * 3600000).toISOString();
  let cases = [
    { id: 'FIX-001', title: 'PC-14 monitor not displaying', category: 'Computer / IT', issueType: 'Display failure', asset: 'PC-14', location: 'lab1', priority: 'high', status: 'in_progress', assignedTo: 'tech-1', description: 'The monitor stays black after turning on the system. The CPU power indicator is on. Please inspect the cable and display.', createdAt: ago(30), updatedAt: ago(1.5) },
    { id: 'FIX-002', title: 'Water leaking near hostel washroom', category: 'Plumbing', issueType: 'Water leak', asset: 'TAP-B2', location: 'hostel', priority: 'critical', status: 'new', assignedTo: null, description: 'Water is pooling near the washbasin in Wing B. The leak continues even when the tap is closed.', createdAt: ago(3), updatedAt: ago(3) },
    { id: 'FIX-003', title: 'Ceiling fan making a loud noise', category: 'Electrical', issueType: 'Fan not working', asset: 'FAN-06', location: 'library', priority: 'medium', status: 'assigned', assignedTo: 'tech-2', description: 'The ceiling fan above the reading tables makes a rattling sound and runs slowly.', createdAt: ago(20), updatedAt: ago(4) },
    { id: 'FIX-004', title: 'Projector image is flickering', category: 'Computer / IT', issueType: 'Display failure', asset: 'PRJ-04', location: 'class', priority: 'medium', status: 'resolved', assignedTo: 'tech-1', description: 'The projector flickers during lessons when connected to a laptop.', repairNote: 'Replaced the HDMI cable and tested the display for 20 minutes. Image is stable.', createdAt: ago(58), updatedAt: ago(6) },
    { id: 'FIX-005', title: 'Wi-Fi connection drops in Lab 1', category: 'Internet', issueType: 'No connection', asset: 'RTR-01', location: 'lab1', priority: 'high', status: 'in_progress', assignedTo: 'tech-1', description: 'Several computers lose internet access every few minutes.', createdAt: ago(16), updatedAt: ago(2) },
    { id: 'FIX-006', title: 'Loose leg on library study desk', category: 'Furniture', issueType: 'Damaged desk', asset: 'DESK-12', location: 'library', priority: 'low', status: 'triaged', assignedTo: null, description: 'The left leg of study desk 12 is loose. The desk wobbles when used.', createdAt: ago(48), updatedAt: ago(24) },
    { id: 'FIX-007', title: 'Classroom light needs replacement', category: 'Electrical', issueType: 'Light not working', asset: '', location: 'class', priority: 'low', status: 'closed', assignedTo: 'tech-2', description: 'Light above the whiteboard is not working.', repairNote: 'Replaced LED tube. All classroom lights checked.', createdAt: ago(110), updatedAt: ago(48) },
    { id: 'FIX-008', title: 'Cafeteria drain is blocked', category: 'Plumbing', issueType: 'Blocked drain', asset: '', location: 'canteen', priority: 'high', status: 'closed', assignedTo: 'tech-3', description: 'Water is draining very slowly in the cafeteria sink.', repairNote: 'Cleared blockage and flushed the line.', createdAt: ago(90), updatedAt: ago(55) },
    { id: 'FIX-009', title: 'Keyboard keys are not responding', category: 'Computer / IT', issueType: 'Keyboard failure', asset: 'PC-08', location: 'lab2', priority: 'medium', status: 'closed', assignedTo: 'tech-1', description: 'Several keys are unresponsive on PC-08.', repairNote: 'Keyboard replaced and checked.', createdAt: ago(144), updatedAt: ago(96) },
    { id: 'FIX-010', title: 'Air conditioner needs servicing', category: 'Electrical', issueType: 'Power outage', asset: 'AC-02', location: 'office', priority: 'low', status: 'closed', assignedTo: 'tech-2', description: 'Cooling performance is below normal.', repairNote: 'Filters cleaned and thermostat calibrated.', createdAt: ago(160), updatedAt: ago(120) },
    { id: 'FIX-011', title: 'Auditorium entrance needs cleaning', category: 'Cleaning', issueType: 'Cleaning needed', asset: '', location: 'auditorium', priority: 'low', status: 'new', assignedTo: null, description: 'Please clean the entrance after the morning event.', createdAt: ago(1), updatedAt: ago(1) },
    { id: 'FIX-012', title: 'Exposed wire near stairwell light', category: 'Electrical', issueType: 'Exposed wiring', asset: '', location: 'hostel', priority: 'critical', status: 'assigned', assignedTo: 'tech-2', description: 'A wire is visible near the stairwell light. The area has been kept clear and the office has been informed.', createdAt: ago(5), updatedAt: ago(2) }
  ];

  let reports = cases.map((c, i) => ({
    id: 'RPT-' + String(i + 1).padStart(3, '0'),
    title: c.title,
    description: c.description,
    category: c.category,
    issueType: c.issueType,
    asset: c.asset,
    location: c.location,
    reporter: i % 3 === 0 ? 'reporter-1' : 'reporter-' + (i % 3 + 1),
    reporterName: i % 3 === 0 ? 'Nifu (Student Reporter)' : 'Campus member',
    caseId: c.id,
    triaged: true,
    safety: c.priority === 'critical',
    createdAt: c.createdAt
  }));

  reports.push(
    { id: 'RPT-013', title: 'Computer 14 screen stays black', description: 'PC-14 has no display even though it is turned on.', category: 'Computer / IT', issueType: 'Display failure', asset: 'PC-14', location: 'lab1', reporter: 'reporter-2', reporterName: 'Amina K. (Student)', caseId: null, triaged: false, safety: false, createdAt: ago(0.5) },
    { id: 'RPT-014', title: 'Monitor on PC-14 is not working', description: 'The screen remains blank in our computer lab.', category: 'Computer / IT', issueType: 'Display failure', asset: 'PC-14', location: 'lab1', reporter: 'reporter-1', reporterName: 'Nifu (Student Reporter)', caseId: 'FIX-001', triaged: true, safety: false, createdAt: ago(5) },
    { id: 'RPT-015', title: 'PC 14 keyboard does not type', description: 'The keyboard is not responding on PC-14.', category: 'Computer / IT', issueType: 'Keyboard failure', asset: 'PC-14', location: 'lab1', reporter: 'reporter-3', reporterName: 'Rahul Sharma (Student)', caseId: null, triaged: false, safety: false, createdAt: ago(0.2) }
  );

  let updates = cases.flatMap(c => [
    { id: crypto.randomUUID(), caseId: c.id, actor: 'Campus member', action: 'Issue reported', note: c.description, createdAt: c.createdAt },
    ...(c.assignedTo ? [{ id: crypto.randomUUID(), caseId: c.id, actor: 'Maintenance admin', action: 'Technician assigned', note: (technicians.find(t => t.id === c.assignedTo || t.legacyId === c.assignedTo)?.name || 'Technician') + ' was assigned to this case.', createdAt: ago(Math.max(1, (now - new Date(c.createdAt)) / 3600000 - 2)) }] : []),
    ...(['in_progress', 'resolved', 'closed'].includes(c.status) ? [{ id: crypto.randomUUID(), caseId: c.id, actor: technicians.find(t => t.id === c.assignedTo || t.legacyId === c.assignedTo)?.name || 'Maintenance team', action: c.status === 'in_progress' ? 'Repair in progress' : c.status === 'closed' ? 'Repair verified and closed' : 'Repair completed', note: c.repairNote || 'Diagnosis and repair are underway.', createdAt: c.updatedAt }] : [])
  ]);

  return {
    version: 1,
    cases,
    reports,
    updates,
    technicians: structuredClone(technicians),
    assets: structuredClone(assets),
    profile: {
      id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Campus Admin',
      email: 'admin@fixtrack.campus',
      department: 'Campus Facilities & Operations',
      phone: '',
      role: 'admin'
    },
    settings: {
      campus: 'Darul Uloom Campus',
      emailNotifications: true,
      inAppNotifications: true,
      sla: 24,
      emergency: 'Contact the campus office or the nearest responsible staff member immediately.'
    },
    readNotifications: [],
    createdAt: now.toISOString()
  };
}
