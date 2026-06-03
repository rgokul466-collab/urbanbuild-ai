/* ============================================================
   UrbanBuild AI — seed data for the employee platform (prototype)
   All data is mock and lives client-side only.
   ============================================================ */
window.SEED = (function () {
  'use strict';

  // ---- Roles ----------------------------------------------------------------
  var ROLES = {
    worker:     { id: 'worker',     label: 'Site Worker',          short: 'Worker',     color: '#2563eb' },
    supervisor: { id: 'supervisor', label: 'Site Supervisor',      short: 'Supervisor', color: '#7c3aed' },
    safety:     { id: 'safety',     label: 'Safety Officer',       short: 'Safety',     color: '#f59e0b' },
    pm:         { id: 'pm',         label: 'Project Manager',      short: 'PM',         color: '#0ea5e9' },
    logistics:  { id: 'logistics',  label: 'Logistics Coordinator',short: 'Logistics',  color: '#16a34a' },
    admin:      { id: 'admin',      label: 'UBA Administrator',    short: 'Admin',      color: '#e11d48' }
  };

  // ---- Demo users (one sign-in per role) ------------------------------------
  var USERS = [
    { id: 'u_gokul',  name: 'Gokul Ravindran', role: 'worker',     title: 'Formwork & Scaffolding', email: 'gokul@urbanbuild.ai',  site: 'Barangaroo C3', zone: 'Zone B', trade: 'Subcontractor', initials: 'GR' },
    { id: 'u_marcus', name: 'Marcus Hale',     role: 'supervisor', title: 'Level 4 Supervisor',     email: 'marcus@urbanbuild.ai', site: 'Barangaroo C3', zone: 'Level 4',  initials: 'MH' },
    { id: 'u_sarah',  name: 'Sarah Jenkins',   role: 'safety',     title: 'Site Safety Officer',    email: 'sarah@urbanbuild.ai',  site: 'Barangaroo C3', zone: 'All zones',initials: 'SJ' },
    { id: 'u_elena',  name: 'Elena Brookes',   role: 'pm',         title: 'Project Manager',        email: 'elena@urbanbuild.ai',  site: 'Barangaroo C3', zone: 'Project',  initials: 'EB' },
    { id: 'u_daniel', name: 'Daniel Osei',     role: 'logistics',  title: 'Logistics Coordinator',  email: 'daniel@urbanbuild.ai', site: 'Barangaroo C3', zone: 'Yard',     initials: 'DO' },
    { id: 'u_priya',  name: 'Priya Nair',      role: 'admin',      title: 'Platform Administrator', email: 'priya@urbanbuild.ai',  site: 'All sites',     zone: '—',        initials: 'PN' }
  ];

  // ---- Crew / people directory ---------------------------------------------
  var CREW = [
    { id: 'u_gokul',  name: 'Gokul Ravindran', role: 'worker', trade: 'Formwork',    zone: 'Zone B',  onSite: true,  credentials: 'valid',    initials: 'GR' },
    { id: 'w_joel',   name: 'Joel Joseph',     role: 'worker', trade: 'Steel fixer',  zone: 'Level 3', onSite: true,  credentials: 'valid',    initials: 'JJ' },
    { id: 'w_amara',  name: 'Amara Okafor',    role: 'worker', trade: 'Concreter',    zone: 'Level 4', onSite: true,  credentials: 'valid',    initials: 'AO' },
    { id: 'w_liam',   name: 'Liam Carter',     role: 'worker', trade: 'Scaffolder',   zone: 'Level 5', onSite: false, credentials: 'expiring', initials: 'LC' },
    { id: 'w_sofia',  name: 'Sofia Rossi',     role: 'worker', trade: 'Electrician',  zone: 'Zone C',  onSite: true,  credentials: 'valid',    initials: 'SR' },
    { id: 'w_tane',   name: 'Tane Wiremu',     role: 'worker', trade: 'Crane dogger',  zone: 'Yard',    onSite: false, credentials: 'invalid',  initials: 'TW' },
    { id: 'u_marcus', name: 'Marcus Hale',     role: 'supervisor', trade: 'Supervisor', zone: 'Level 4', onSite: true, credentials: 'valid', initials: 'MH' },
    { id: 'u_sarah',  name: 'Sarah Jenkins',   role: 'safety', trade: 'Safety Officer', zone: 'All', onSite: true, credentials: 'valid', initials: 'SJ' }
  ];

  // ---- Credentials (Digital Passport). Keyed by user id. --------------------
  // RSA included to match the uploaded sample credential; First Aid expiring soon.
  var CREDENTIALS = {
    u_gokul: [
      { type: 'White Card',                  ref: 'WC-4471902',   status: 'valid',    issued: '2023-02-11', expiry: '2028-02-11', issuer: 'SafeWork NSW' },
      { type: 'High-Risk Work Licence (Scaffolding)', ref: 'HRW-SB-88231', status: 'valid', issued: '2022-09-03', expiry: '2027-09-03', issuer: 'SafeWork NSW' },
      { type: 'Responsible Service of Alcohol', ref: 'ctw1266097', status: 'valid', issued: '2026-05-28', expiry: '2031-05-28', issuer: 'Liquor & Gaming NSW' },
      { type: 'Site Induction — Barangaroo C3', ref: 'IND-C3-2041', status: 'valid', issued: '2026-05-30', expiry: '2026-11-30', issuer: 'UrbanBuild AI' },
      { type: 'First Aid Certificate',       ref: 'FA-220194',    status: 'expiring', issued: '2024-06-20', expiry: '2026-06-21', issuer: 'St John Ambulance' }
    ]
  };

  // ---- Work packages (the lifecycle) ----------------------------------------
  // status: pending | credential_failed | in_progress | submitted | under_review | approved | rejected | closed | paused
  var WORK_PACKAGES = [
    { id: 'WP-2041', title: 'Formwork install — Level 4 East', site: 'Barangaroo C3', zone: 'Level 4', assignee: 'u_gokul', assigneeName: 'Gokul Ravindran', supervisor: 'u_marcus', pm: 'u_elena', priority: 'High', status: 'under_review', due: '2026-06-02', milestone: 'L4 structural shell', workLog: 'Installed formwork panels to L4 East grid lines 4–9. Bracing checked, ready for pour. 7.5 hrs.', evidence: 2 },
    { id: 'WP-2042', title: 'Concrete pour prep — Level 4', site: 'Barangaroo C3', zone: 'Level 4', assignee: 'u_gokul', assigneeName: 'Gokul Ravindran', supervisor: 'u_marcus', pm: 'u_elena', priority: 'High', status: 'in_progress', due: '2026-06-03', milestone: 'L4 structural shell', workLog: '', evidence: 0, aiFlag: 'Pour dependency may slip 2 days if WP-2041 review is not cleared today.' },
    { id: 'WP-2043', title: 'Rebar fixing — Level 3 slab', site: 'Barangaroo C3', zone: 'Level 3', assignee: 'u_gokul', assigneeName: 'Gokul Ravindran', supervisor: 'u_marcus', pm: 'u_elena', priority: 'Medium', status: 'pending', due: '2026-06-04', milestone: 'L3 slab', workLog: '', evidence: 0 },
    { id: 'WP-2045', title: 'Edge protection — Level 4', site: 'Barangaroo C3', zone: 'Level 4', assignee: 'w_amara', assigneeName: 'Amara Okafor', supervisor: 'u_marcus', pm: 'u_elena', priority: 'High', status: 'paused', due: '2026-06-02', milestone: 'L4 structural shell', workLog: 'Paused — hazard HZ-119 reported nearby.', evidence: 0, pausedBy: 'HZ-119' },
    { id: 'WP-2044', title: 'Scaffold inspection — Level 5', site: 'Barangaroo C3', zone: 'Level 5', assignee: 'w_liam', assigneeName: 'Liam Carter', supervisor: 'u_marcus', pm: 'u_elena', priority: 'Medium', status: 'credential_failed', due: '2026-06-05', milestone: 'L5 access', workLog: '', evidence: 0, note: 'Scaffolding licence expiring — renewal required before start.' },
    { id: 'WP-2046', title: 'Steel fixing — Level 3 columns', site: 'Barangaroo C3', zone: 'Level 3', assignee: 'w_joel', assigneeName: 'Joel Joseph', supervisor: 'u_marcus', pm: 'u_elena', priority: 'Medium', status: 'submitted', due: '2026-06-03', milestone: 'L3 slab', workLog: 'Columns C3–C7 tied and inspected. 6 hrs.', evidence: 1 },
    { id: 'WP-2040', title: 'Crane base pour — Zone A', site: 'Barangaroo C3', zone: 'Zone A', assignee: 'w_amara', assigneeName: 'Amara Okafor', supervisor: 'u_marcus', pm: 'u_elena', priority: 'High', status: 'approved', due: '2026-05-29', milestone: 'Site establishment', workLog: 'Crane base poured and cured. Sign-off complete.', evidence: 3 },
    { id: 'WP-2039', title: 'Perimeter fencing & signage', site: 'Barangaroo C3', zone: 'Perimeter', assignee: 'w_sofia', assigneeName: 'Sofia Rossi', supervisor: 'u_marcus', pm: 'u_elena', priority: 'Low', status: 'closed', due: '2026-05-27', milestone: 'Site establishment', workLog: 'Fencing and signage installed and archived.', evidence: 2 }
  ];

  // ---- Hazards --------------------------------------------------------------
  // severity: high | medium | low ; status: open | in_progress | resolved
  var HAZARDS = [
    { id: 'HZ-119', title: 'Unguarded leading edge', zone: 'Level 5 — West', severity: 'high',   status: 'open',        reportedBy: 'Liam Carter',     reporterId: 'w_liam',  time: '8 min ago',   desc: 'Temporary edge protection removed and not reinstated near the void on L5 West.', assignedTo: 'u_sarah', photo: true, linkedWp: 'WP-2045' },
    { id: 'HZ-118', title: 'Exposed rebar near walkway', zone: 'Level 4 — East', severity: 'high', status: 'in_progress', reportedBy: 'Gokul Ravindran', reporterId: 'u_gokul', time: '24 min ago',  desc: 'Protruding starter bars without caps next to the main pedestrian walkway. Impalement risk.', assignedTo: 'u_sarah', photo: true, linkedWp: 'WP-2042' },
    { id: 'HZ-117', title: 'Spilled hydraulic fluid',  zone: 'Zone C — Plant',  severity: 'medium', status: 'resolved',    reportedBy: 'Sofia Rossi',     reporterId: 'w_sofia', time: '2 hrs ago',   desc: 'Hydraulic fluid leak from excavator creating a slip hazard. Bunded and cleaned.', assignedTo: 'u_sarah', photo: false },
    { id: 'HZ-116', title: 'Frayed harness lanyard',   zone: 'Level 4 — Store', severity: 'low',    status: 'resolved',    reportedBy: 'Joel Joseph',     reporterId: 'w_joel',  time: 'Yesterday',   desc: 'Worn lanyard found during pre-start check and removed from service.', assignedTo: 'u_sarah', photo: false }
  ];

  // ---- Notifications (per role/user, simplified to a shared feed) -----------
  var NOTIFICATIONS = [
    { id: 'n1', icon: 'hazard', text: 'New high-severity hazard <b>HZ-119</b> reported on Level 5.', time: '8 min ago',  roles: ['safety','supervisor','pm'], read: false },
    { id: 'n2', icon: 'task',   text: 'Work package <b>WP-2041</b> is awaiting your review.',        time: '20 min ago', roles: ['supervisor','pm'],          read: false },
    { id: 'n3', icon: 'id',     text: 'Your <b>First Aid Certificate</b> expires in 20 days.',       time: '1 hr ago',   roles: ['worker'],                  read: false },
    { id: 'n4', icon: 'check',  text: 'Milestone <b>Crane base pour</b> was approved.',              time: '3 hrs ago',  roles: ['pm','supervisor','worker'], read: true },
    { id: 'n5', icon: 'lock',   text: 'Scaffolding licence for <b>Liam Carter</b> needs renewal.',   time: 'Today',      roles: ['admin','supervisor'],      read: false }
  ];

  // ---- Audit log ------------------------------------------------------------
  var AUDIT = [
    { time: '09:41', actor: 'Gokul Ravindran', action: 'Site check-in approved', target: 'Zone B', type: 'access' },
    { time: '09:38', actor: 'Gokul Ravindran', action: 'Submitted work log',     target: 'WP-2041', type: 'work' },
    { time: '09:21', actor: 'Gokul Ravindran', action: 'Reported hazard',        target: 'HZ-118', type: 'safety' },
    { time: '08:55', actor: 'System',          action: 'Credential check failed', target: 'WP-2044 · Liam Carter', type: 'security' },
    { time: '08:40', actor: 'Marcus Hale',     action: 'Assigned work package',  target: 'WP-2043 → Gokul Ravindran', type: 'work' },
    { time: '08:12', actor: 'Priya Nair',      action: 'Updated role permissions', target: 'Logistics Coordinator', type: 'admin' },
    { time: 'Yesterday', actor: 'Elena Brookes', action: 'Signed off milestone', target: 'Crane base pour', type: 'work' }
  ];

  // ---- RBAC permission matrix (admin screen) --------------------------------
  var PERMISSIONS = [
    { key: 'register',   label: 'Register & manage own profile' },
    { key: 'checkin',    label: 'Site check-in / check-out' },
    { key: 'tasks',      label: 'View & action assigned work' },
    { key: 'report',     label: 'Report hazards' },
    { key: 'review',     label: 'Review & approve milestones' },
    { key: 'assign',     label: 'Create & assign work packages' },
    { key: 'safety',     label: 'Manage hazard workflow' },
    { key: 'admin',      label: 'Manage users, roles & audit' }
  ];
  var ROLE_PERMS = {
    worker:     { register:true, checkin:true, tasks:true, report:true, review:false, assign:false, safety:false, admin:false },
    supervisor: { register:true, checkin:true, tasks:true, report:true, review:true,  assign:true,  safety:true,  admin:false },
    safety:     { register:true, checkin:true, tasks:false,report:true, review:false, assign:false, safety:true,  admin:false },
    pm:         { register:true, checkin:false,tasks:false,report:true, review:true,  assign:true,  safety:false, admin:false },
    logistics:  { register:true, checkin:true, tasks:true, report:true, review:false, assign:true,  safety:false, admin:false },
    admin:      { register:true, checkin:false,tasks:false,report:false,review:false, assign:false, safety:false, admin:true }
  };

  // ---- Project KPIs (PM / dashboards) ---------------------------------------
  var PROJECT = {
    name: 'Barangaroo C3', client: 'Lendlease', budget: 220, spent: 86,
    milestonesDone: 4, milestonesTotal: 11, progress: 38, daysToDeadline: 142
  };

  return {
    ROLES: ROLES, USERS: USERS, CREW: CREW, CREDENTIALS: CREDENTIALS,
    WORK_PACKAGES: WORK_PACKAGES, HAZARDS: HAZARDS, NOTIFICATIONS: NOTIFICATIONS,
    AUDIT: AUDIT, PERMISSIONS: PERMISSIONS, ROLE_PERMS: ROLE_PERMS, PROJECT: PROJECT
  };
})();
