/* ============================================================
   UrbanBuild AI — employee platform (prototype SPA)
   Vanilla JS, no dependencies. Client-side mock data only.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- utils ---------------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var root = function () { return document.getElementById('root'); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function byId(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; }
  function icon(name, cls) { return '<svg class="ic ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; }
  function initialsColor(role) { return (SEED.ROLES[role] && SEED.ROLES[role].color) || '#2563eb'; }

  /* ---------------- state ---------------- */
  var DB, state;
  function reset() {
    DB = {
      USERS: clone(SEED.USERS), CREW: clone(SEED.CREW), CREDENTIALS: clone(SEED.CREDENTIALS),
      WORK_PACKAGES: clone(SEED.WORK_PACKAGES), HAZARDS: clone(SEED.HAZARDS),
      NOTIFICATIONS: clone(SEED.NOTIFICATIONS), AUDIT: clone(SEED.AUDIT),
      ROLE_PERMS: clone(SEED.ROLE_PERMS), PROJECT: clone(SEED.PROJECT)
    };
    state = { user: null, route: 'dashboard', ui: { notif: false, menu: false, sidebar: false, wpFilter: 'all', hzFilter: 'all' } };
  }

  /* ---------------- memory / persistence ---------------- */
  var DB_KEY = 'uba_db_v1', SESS_KEY = 'uba_sess_v1';
  var rememberMe = false;
  function persist() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(DB)); } catch (e) {}
    try {
      if (rememberMe && state.user) localStorage.setItem(SESS_KEY, JSON.stringify({ user: state.user, route: state.route }));
      else localStorage.removeItem(SESS_KEY);
    } catch (e) {}
  }
  function loadJSON(key) { try { var s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function clearMemory() { try { localStorage.removeItem(DB_KEY); localStorage.removeItem(SESS_KEY); } catch (e) {} }

  /* ---------------- status meta ---------------- */
  var WP = {
    pending:           { label: 'Pending',            cls: 'gray',   col: 'assigned' },
    credential_failed: { label: 'Credential failed',  cls: 'red',    col: 'assigned' },
    in_progress:       { label: 'In progress',        cls: 'blue',   col: 'progress' },
    rejected:          { label: 'Rework requested',   cls: 'red',    col: 'progress' },
    paused:            { label: 'Paused · hazard',    cls: 'amber',  col: 'progress' },
    submitted:         { label: 'Submitted',          cls: 'indigo', col: 'review' },
    under_review:      { label: 'Under review',       cls: 'amber',  col: 'review' },
    approved:          { label: 'Approved',           cls: 'green',  col: 'done' },
    closed:            { label: 'Closed',             cls: 'slate',  col: 'done' }
  };
  var HZ = { open: { label: 'Open', cls: 'red' }, in_progress: { label: 'In progress', cls: 'amber' }, resolved: { label: 'Resolved', cls: 'green' } };
  var SEV = { high: 'red', medium: 'amber', low: 'slate' };

  /* ---------------- navigation per role ---------------- */
  var NAV = {
    worker:     [['dashboard','Dashboard','grid'],['work','My Work','task'],['checkin','Site Check-in','pin'],['hazards','Safety','hazard'],['passport','Digital Passport','id'],['notifications','Notifications','bell']],
    supervisor: [['dashboard','Dashboard','grid'],['work','Work Packages','task'],['people','Crew','users'],['hazards','Safety','hazard'],['audit','Activity','list'],['notifications','Notifications','bell']],
    safety:     [['dashboard','Dashboard','grid'],['hazards','Hazard Queue','hazard'],['credentials','Compliance','id'],['people','Workforce','users'],['notifications','Notifications','bell']],
    pm:         [['dashboard','Dashboard','grid'],['work','Work Packages','task'],['people','Team','users'],['audit','Audit Log','list'],['notifications','Notifications','bell']],
    logistics:  [['dashboard','Dashboard','grid'],['people','Workforce','users'],['work','Work Packages','task'],['checkin','Site Map','pin'],['notifications','Notifications','bell']],
    admin:      [['dashboard','Dashboard','grid'],['users','Users & Roles','users'],['credentials','Credential Queue','id'],['audit','Audit Log','list'],['settings','Settings','cog'],['notifications','Notifications','bell']]
  };

  /* ---------------- auth ---------------- */
  function login(userId) {
    var u = byId(DB.USERS, userId) || byId(SEED.USERS, userId);
    if (!u) { toast('No matching account found', 'error'); return; }
    state.user = clone(u);
    state.user.checkedIn = u.role === 'worker' ? true : false;
    state.user.checkinTime = '09:41';
    state.route = 'dashboard';
    state.ui.notif = state.ui.menu = state.ui.sidebar = false;
    renderApp();
  }
  function logout() { state.user = null; rememberMe = false; try { localStorage.removeItem(SESS_KEY); } catch (e) {} state.ui.authTab = 'login'; renderLogin(); }

  /* ---------------- toast ---------------- */
  function toast(msg, type) {
    var t = document.getElementById('toast-root');
    var el = document.createElement('div');
    el.className = 'toast toast--' + (type || 'ok');
    el.innerHTML = icon(type === 'error' ? 'x' : (type === 'warn' ? 'hazard' : 'check')) + '<span>' + msg + '</span>';
    t.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () { el.classList.remove('show'); setTimeout(function () { el.remove(); }, 300); }, 2800);
  }

  /* ---------------- modal ---------------- */
  function openModal(html) {
    var m = document.getElementById('modal-root');
    m.innerHTML = '<div class="modal-backdrop" data-action="close-modal"></div><div class="modal" role="dialog" aria-modal="true">' + html + '</div>';
    m.classList.add('open');
  }
  function closeModal() { var m = document.getElementById('modal-root'); m.classList.remove('open'); m.innerHTML = ''; }

  /* ============================================================
     LOGIN
     ============================================================ */
  function renderLogin() {
    document.getElementById('modal-root').innerHTML = '';
    var tab = state.ui.authTab || 'login';
    var empOptions = SEED.USERS.map(function (u) {
      return '<option value="' + u.id + '">' + esc(u.name) + '  —  ' + esc(SEED.ROLES[u.role].label) + '</option>';
    }).join('');
    var roleOpts = Object.keys(SEED.ROLES).map(function (rk) { return '<option value="' + rk + '">' + esc(SEED.ROLES[rk].label) + '</option>'; }).join('');
    root().innerHTML =
      '<div class="login">' +
        '<div class="login__bg" aria-hidden="true">' +
          '<div class="login__mesh"></div><div class="login__grid"></div>' +
          '<div class="login__orb login__orb--1"></div><div class="login__orb login__orb--2"></div><div class="login__orb login__orb--3"></div>' +
        '</div>' +
        '<header class="login__top">' +
          '<span class="brand"><span class="brand__mark">' + icon('logo') + '</span><span class="brand__name">UrbanBuild<span class="brand__ai"> AI</span></span></span>' +
        '</header>' +
        '<main class="login__center">' +
          '<div class="login__card">' +
            '<div class="authtabs">' +
              '<button class="authtab' + (tab === 'login' ? ' is-active' : '') + '" data-action="auth-tab" data-tab="login">Log in</button>' +
              '<button class="authtab' + (tab === 'signup' ? ' is-active' : '') + '" data-action="auth-tab" data-tab="signup">Sign up</button>' +
            '</div>' +
            // ---- LOGIN panel ----
            '<div class="authpanel' + (tab === 'login' ? ' is-active' : '') + '" data-panel="login">' +
              '<h2>Welcome back</h2>' +
              '<p class="login__sub">Sign in with your username or work email.</p>' +
              '<form id="loginForm" class="login__form" novalidate>' +
                '<label class="fl">Username or email<input type="text" id="loginEmail" placeholder="gokul or you@urbanbuild.ai" autocomplete="username"/></label>' +
                '<label class="fl"><span class="fl__row">Password <a class="fl__link" data-action="noop" href="#">Forgot?</a></span>' +
                  '<div class="pwwrap"><input type="password" id="loginPass" placeholder="••••••••" autocomplete="current-password"/>' +
                  '<button type="button" class="pwtoggle" data-action="toggle-pw" data-target="loginPass" aria-label="Show password">' + icon('eye') + '</button></div></label>' +
                '<label class="checkline"><input type="checkbox" id="rememberMe"/><span>Keep me signed in on this device</span></label>' +
                '<button type="submit" class="btn btn--primary btn--block">Sign in ' + icon('arrow') + '</button>' +
              '</form>' +
              '<div class="login__divider"><span>or log in as an employee</span></div>' +
              '<div class="empselect-wrap">' + icon('users', 'empselect-ic') +
                '<select id="empSelect" class="empselect" aria-label="Log in as an employee">' +
                  '<option value="">Select an employee…</option>' + empOptions +
                '</select>' +
              '</div>' +
            '</div>' +
            // ---- SIGN UP panel ----
            '<div class="authpanel' + (tab === 'signup' ? ' is-active' : '') + '" data-panel="signup">' +
              '<h2>Create your profile</h2>' +
              '<p class="login__sub">Register a digital profile to access the site platform.</p>' +
              '<form id="signupForm" class="login__form" novalidate>' +
                '<label class="fl">Full name<input type="text" id="suName" placeholder="Jordan Smith" autocomplete="name"/></label>' +
                '<label class="fl">Work email<input type="email" id="suEmail" placeholder="you@urbanbuild.ai" autocomplete="email"/></label>' +
                '<label class="fl">Your role<select id="suRole">' + roleOpts + '</select></label>' +
                '<div class="form__row">' +
                  '<label class="fl">Password<div class="pwwrap"><input type="password" id="suPass" placeholder="At least 6 characters" autocomplete="new-password"/>' +
                    '<button type="button" class="pwtoggle" data-action="toggle-pw" data-target="suPass" aria-label="Show password">' + icon('eye') + '</button></div></label>' +
                  '<label class="fl">Confirm<div class="pwwrap"><input type="password" id="suConf" placeholder="Re-enter" autocomplete="new-password"/>' +
                    '<button type="button" class="pwtoggle" data-action="toggle-pw" data-target="suConf" aria-label="Show password">' + icon('eye') + '</button></div></label>' +
                '</div>' +
                '<button type="submit" class="btn btn--primary btn--block">Create account ' + icon('arrow') + '</button>' +
              '</form>' +
              '<p class="login__fineprint">By creating an account you agree to UrbanBuild AI\'s acceptable-use and site-safety policies.</p>' +
            '</div>' +
          '</div>' +
        '</main>' +
      '</div>';
    var lf = document.getElementById('loginForm');
    if (lf) lf.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = $('#loginEmail').value.trim().toLowerCase();
      if (!q) { toast('Enter your username or email', 'error'); return; }
      var u = DB.USERS.filter(function (x) { return x.email.toLowerCase() === q || x.email.split('@')[0].toLowerCase() === q || x.name.toLowerCase() === q || x.name.split(' ')[0].toLowerCase() === q; })[0];
      rememberMe = !!($('#rememberMe') && $('#rememberMe').checked);
      if (u) login(u.id);
      else toast('No matching account. Try an employee below, or sign up.', 'error');
    });
    var sf = document.getElementById('signupForm');
    if (sf) sf.addEventListener('submit', function (e) { e.preventDefault(); register(); });
    var es = document.getElementById('empSelect');
    if (es) es.addEventListener('change', function () { if (this.value) login(this.value); });
  }

  function register() {
    var name = ($('#suName') || {}).value || '', email = (($('#suEmail') || {}).value || '').trim().toLowerCase(), role = ($('#suRole') || {}).value, pass = ($('#suPass') || {}).value || '', conf = ($('#suConf') || {}).value || '';
    if (!name.trim()) { toast('Enter your full name', 'error'); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast('Enter a valid work email', 'error'); return; }
    if (pass.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
    if (pass !== conf) { toast('Passwords do not match', 'error'); return; }
    if (DB.USERS.some(function (u) { return u.email.toLowerCase() === email; })) { toast('An account with that email already exists', 'error'); return; }
    var ini = name.trim().split(/\s+/).map(function (p) { return p[0]; }).slice(0, 2).join('').toUpperCase();
    var id = 'u_' + Date.now();
    var isWorker = role === 'worker';
    var u = { id: id, name: name.trim(), role: role, title: isWorker ? 'New starter' : SEED.ROLES[role].label, email: email, site: 'Barangaroo C3', zone: isWorker ? 'Unassigned' : SEED.ROLES[role].short, trade: isWorker ? 'New starter' : '', initials: ini };
    DB.USERS.push(u);
    DB.CREW.push({ id: id, name: u.name, role: role, trade: u.trade || SEED.ROLES[role].short, zone: u.zone, onSite: false, credentials: 'valid', initials: ini });
    DB.AUDIT.unshift({ time: nowTime(), actor: u.name, action: 'Registered digital profile', target: SEED.ROLES[role].label, type: 'access' });
    login(id);
    toast('Welcome, ' + u.name.split(' ')[0] + '! Your digital profile is created.');
  }

  /* ============================================================
     APP SHELL
     ============================================================ */
  function renderApp() {
    var u = state.user; if (!u) { renderLogin(); return; }
    var r = SEED.ROLES[u.role];
    root().innerHTML =
      '<div class="app' + (state.ui.sidebar ? ' app--drawer' : '') + '">' +
        sidebar(u, r) +
        '<div class="app__main">' +
          topbar(u, r) +
          '<div class="content" id="content">' + page(u) + '</div>' +
        '</div>' +
        '<div class="scrim" data-action="close-sidebar"></div>' +
      '</div>';
    persist();
  }

  function navBadge(route, u) {
    var n = 0;
    if (route === 'hazards') n = DB.HAZARDS.filter(function (h) { return h.status !== 'resolved'; }).length;
    else if (route === 'work' && (u.role === 'supervisor' || u.role === 'pm')) n = DB.WORK_PACKAGES.filter(function (w) { return w.status === 'submitted' || w.status === 'under_review'; }).length;
    else if (route === 'work' && u.role === 'worker') n = DB.WORK_PACKAGES.filter(function (w) { return w.assignee === u.id && w.status !== 'closed' && w.status !== 'approved'; }).length;
    else if (route === 'notifications') n = unread(u);
    if (route === 'hazards' && u.role === 'worker') n = 0;
    return n > 0 ? '<span class="nav__badge">' + n + '</span>' : '';
  }
  function sidebar(u, r) {
    var items = (NAV[u.role] || []).map(function (it) {
      var active = state.route === it[0] ? ' is-active' : '';
      return '<button class="navitem' + active + '" data-action="nav" data-route="' + it[0] + '">' +
        icon(it[2], 'navitem__ic') + '<span>' + it[1] + '</span>' + navBadge(it[0], u) + '</button>';
    }).join('');
    return '<aside class="sidebar">' +
      '<div class="sidebar__brand"><span class="brand__mark">' + icon('logo') + '</span><span class="brand__name">UrbanBuild<span class="brand__ai"> AI</span></span></div>' +
      '<nav class="sidebar__nav">' + items + '</nav>' +
      '<div class="sidebar__user">' +
        '<span class="avatar" style="background:' + r.color + '">' + u.initials + '</span>' +
        '<div class="sidebar__usermeta"><strong>' + esc(u.name) + '</strong><small>' + esc(r.label) + '</small></div>' +
        '<button class="iconbtn" data-action="logout" title="Sign out">' + icon('logout') + '</button>' +
      '</div>' +
    '</aside>';
  }

  function topbar(u, r) {
    var checkin = u.role === 'worker'
      ? '<button class="checkpill ' + (u.checkedIn ? 'is-in' : 'is-out') + '" data-action="' + (u.checkedIn ? 'checkout' : 'checkin') + '">' +
          icon('pin') + '<span>' + (u.checkedIn ? 'On site · ' + esc(u.zone) : 'Check in') + '</span></button>'
      : '<span class="sitepill">' + icon('cube') + ' ' + esc(u.site) + '</span>';
    return '<header class="topbar">' +
      '<button class="iconbtn topbar__burger" data-action="toggle-sidebar">' + icon('menu') + '</button>' +
      '<div class="topbar__title"><h1>' + pageTitle() + '</h1><p>' + pageSub(u) + '</p></div>' +
      '<div class="topbar__search"><span>' + icon('search') + '</span><input placeholder="Search work, hazards, people…" id="globalSearch"/></div>' +
      '<div class="topbar__actions">' +
        checkin +
        '<div class="notifwrap">' +
          '<button class="iconbtn iconbtn--ring" data-action="toggle-notif">' + icon('bell') + (unread(u) ? '<span class="dotbadge">' + unread(u) + '</span>' : '') + '</button>' +
          (state.ui.notif ? notifDropdown(u) : '') +
        '</div>' +
        '<div class="usermenu">' +
          '<button class="usermenu__btn" data-action="toggle-menu"><span class="avatar avatar--sm" style="background:' + r.color + '">' + u.initials + '</span></button>' +
          (state.ui.menu ? userDropdown(u, r) : '') +
        '</div>' +
      '</div>' +
    '</header>';
  }

  function unread(u) { return DB.NOTIFICATIONS.filter(function (n) { return !n.read && n.roles.indexOf(u.role) !== -1; }).length; }
  function notifDropdown(u) {
    var list = DB.NOTIFICATIONS.filter(function (n) { return n.roles.indexOf(u.role) !== -1; });
    var items = list.length ? list.map(function (n) {
      return '<div class="notif' + (n.read ? '' : ' notif--unread') + '"><span class="notif__ic notif__ic--' + n.icon + '">' + icon(n.icon) + '</span>' +
        '<div><p>' + n.text + '</p><small>' + esc(n.time) + '</small></div></div>';
    }).join('') : '<div class="dropdown__empty">You\'re all caught up.</div>';
    return '<div class="dropdown dropdown--notif"><div class="dropdown__head">Notifications <button class="linkbtn" data-action="mark-read">Mark all read</button></div>' + items + '</div>';
  }
  function userDropdown(u, r) {
    return '<div class="dropdown dropdown--user">' +
      '<div class="dropdown__user"><span class="avatar" style="background:' + r.color + '">' + u.initials + '</span><div><strong>' + esc(u.name) + '</strong><small>' + esc(u.email) + '</small></div></div>' +
      '<div class="dropdown__role">Signed in as <b>' + esc(r.label) + '</b></div>' +
      '<div class="dropdown__switch"><span>Switch role (demo)</span><div class="switchgrid">' +
        SEED.USERS.map(function (x) { var rr = SEED.ROLES[x.role]; return '<button class="switchbtn' + (x.id === u.id ? ' is-on' : '') + '" data-action="login" data-user="' + x.id + '" title="' + esc(x.name) + '"><span style="background:' + rr.color + '">' + x.initials + '</span>' + rr.short + '</button>'; }).join('') +
      '</div></div>' +
      '<button class="dropdown__reset" data-action="reset-demo">' + icon('clock') + ' Reset demo data</button>' +
      '<button class="dropdown__logout" data-action="logout">' + icon('logout') + ' Sign out</button>' +
    '</div>';
  }

  /* page meta */
  function pageTitle() {
    var map = { dashboard: 'Dashboard', work: 'Work Packages', checkin: 'Site Check-in', hazards: 'Safety & Hazards', passport: 'Digital Passport', credentials: 'Credential Compliance', people: 'Workforce', users: 'Users & Roles', audit: 'Activity & Audit', settings: 'Settings', notifications: 'Notifications' };
    if (state.route === 'work' && state.user.role === 'worker') return 'My Work';
    return map[state.route] || 'Dashboard';
  }
  function pageSub(u) {
    var hr = new Date().getHours(); var greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
    if (state.route === 'dashboard') return greet + ', ' + esc(u.name.split(' ')[0]) + ' · ' + esc(u.site);
    return esc(SEED.ROLES[u.role].label) + ' · ' + esc(u.site);
  }

  /* ============================================================
     PAGE ROUTER
     ============================================================ */
  function page(u) {
    switch (state.route) {
      case 'dashboard': return dashboard(u);
      case 'work': return workPage(u);
      case 'checkin': return checkinPage(u);
      case 'hazards': return hazardsPage(u);
      case 'passport': return passportPage(u);
      case 'credentials': return credentialQueue(u);
      case 'people': return peoplePage(u);
      case 'users': return usersRoles(u);
      case 'audit': return auditPage(u);
      case 'settings': return settingsPage(u);
      case 'notifications': return notificationsPage(u);
      default: return dashboard(u);
    }
  }

  /* ---------------- shared components ---------------- */
  function statCard(label, value, sub, ic, tone) {
    return '<div class="stat ' + (tone ? 'stat--' + tone : '') + '">' +
      '<span class="stat__ic">' + icon(ic) + '</span>' +
      '<div class="stat__body"><span class="stat__val">' + value + '</span><span class="stat__lbl">' + label + '</span>' +
      (sub ? '<span class="stat__sub">' + sub + '</span>' : '') + '</div></div>';
  }
  function badge(label, cls) { return '<span class="badge badge--' + cls + '">' + label + '</span>'; }
  function sectionHead(title, action) { return '<div class="block__head"><h2>' + title + '</h2>' + (action || '') + '</div>'; }
  function av(initials, role, sm) { return '<span class="avatar ' + (sm ? 'avatar--sm' : '') + '" style="background:' + initialsColor(role) + '">' + initials + '</span>'; }

  function wpActions(w, u) {
    var a = [];
    var canReview = (u.role === 'supervisor' || u.role === 'pm');
    if (u.role === 'worker' && w.assignee === u.id) {
      if (w.status === 'pending') a.push(btn('Start task', 'start-wp', w.id, 'primary'));
      else if (w.status === 'in_progress') a.push(btn('Submit work log', 'log-wp', w.id, 'primary'));
      else if (w.status === 'rejected') a.push(btn('Redo &amp; resubmit', 'log-wp', w.id, 'primary'));
      else if (w.status === 'credential_failed') a.push(btn('Renew credential', 'renew-wp', w.id, 'warn'));
    }
    if (canReview && (w.status === 'submitted' || w.status === 'under_review')) {
      a.push(btn('Approve', 'approve-wp', w.id, 'primary'));
      a.push(btn('Request rework', 'reject-wp', w.id, 'ghost'));
    }
    if ((canReview || u.role === 'safety') && w.status === 'paused') a.push(btn('Resume work', 'resume-wp', w.id, 'primary'));
    a.push(btn('Details', 'open-wp', w.id, 'ghost'));
    return '<div class="rowactions">' + a.join('') + '</div>';
  }
  function btn(label, action, id, kind) { return '<button class="btn btn--' + (kind || 'ghost') + ' btn--sm" data-action="' + action + '"' + (id ? ' data-id="' + id + '"' : '') + '>' + label + '</button>'; }

  function wpRow(w, u) {
    var s = WP[w.status];
    return '<div class="wprow">' +
      '<div class="wprow__main"><div class="wprow__id">' + w.id + '</div>' +
        '<div><strong>' + esc(w.title) + '</strong><div class="wprow__meta">' + icon('pin') + esc(w.zone) + ' · ' + av(initials(w.assigneeName), 'worker', true) + ' ' + esc(w.assigneeName) + ' · Due ' + esc(w.due) + '</div></div></div>' +
      '<div class="wprow__right">' + (w.priority ? badge(w.priority, w.priority === 'High' ? 'red-soft' : w.priority === 'Medium' ? 'amber-soft' : 'slate-soft') : '') + badge(s.label, s.cls) + '</div>' +
      wpActions(w, u) +
    '</div>';
  }
  function initials(name) { return name.split(' ').map(function (p) { return p[0]; }).slice(0, 2).join(''); }

  function hazardRow(h, u) {
    var canManage = (u.role === 'safety' || u.role === 'supervisor');
    var actions = [];
    if (canManage && h.status === 'open') actions.push(btn('Start response', 'advance-haz', h.id, 'primary'));
    if (canManage && h.status === 'in_progress') actions.push(btn('Mark resolved', 'resolve-haz', h.id, 'primary'));
    actions.push(btn('View', 'open-haz', h.id, 'ghost'));
    return '<div class="hzrow hzrow--' + SEV[h.severity] + '">' +
      '<span class="hzrow__sev">' + icon('hazard') + '</span>' +
      '<div class="hzrow__body"><div class="hzrow__top"><strong>' + esc(h.title) + '</strong>' + badge(h.severity, SEV[h.severity] + '-soft') + badge(HZ[h.status].label, HZ[h.status].cls) + '</div>' +
        '<div class="hzrow__meta">' + h.id + ' · ' + icon('pin') + esc(h.zone) + ' · by ' + esc(h.reportedBy) + ' · ' + esc(h.time) + '</div></div>' +
      '<div class="rowactions">' + actions.join('') + '</div>' +
    '</div>';
  }

  /* ============================================================
     DASHBOARDS
     ============================================================ */
  function dashboard(u) {
    if (u.role === 'worker') return dashWorker(u);
    if (u.role === 'supervisor') return dashSupervisor(u);
    if (u.role === 'safety') return dashSafety(u);
    if (u.role === 'pm') return dashPM(u);
    if (u.role === 'logistics') return dashLogistics(u);
    return dashAdmin(u);
  }

  function dashWorker(u) {
    var mine = DB.WORK_PACKAGES.filter(function (w) { return w.assignee === u.id; });
    var active = mine.filter(function (w) { return w.status !== 'closed' && w.status !== 'approved'; });
    var creds = DB.CREDENTIALS[u.id] || [];
    var validC = creds.filter(function (c) { return c.status === 'valid'; }).length;
    var expiring = creds.filter(function (c) { return c.status === 'expiring'; });
    var myHaz = DB.HAZARDS.filter(function (h) { return h.reporterId === u.id; });
    var banner = '<div class="checkbanner ' + (u.checkedIn ? 'in' : 'out') + '">' + icon('pin') +
      '<div>' + (u.checkedIn ? '<strong>You\'re checked in at ' + esc(u.zone) + '</strong><span>Since ' + esc(u.checkinTime) + ' · credentials verified</span>' : '<strong>You\'re not checked in</strong><span>Check in to access your work for today</span>') + '</div>' +
      '<button class="btn btn--' + (u.checkedIn ? 'ghost' : 'primary') + ' btn--sm" data-action="' + (u.checkedIn ? 'checkout' : 'checkin') + '">' + (u.checkedIn ? 'Check out' : 'Check in') + '</button></div>';
    return '<div class="page">' + banner +
      '<div class="statrow">' +
        statCard('Active tasks', active.length, 'assigned to you', 'task', 'blue') +
        statCard('Credentials valid', validC + '/' + creds.length, expiring.length ? expiring.length + ' expiring soon' : 'all current', 'id', expiring.length ? 'amber' : 'green') +
        statCard('Hazards reported', myHaz.length, 'thanks for keeping site safe', 'hazard', 'amber') +
        statCard('Hours logged', '7.5', 'today', 'clock', 'slate') +
      '</div>' +
      '<div class="grid2">' +
        '<div class="block"><div class="block__head"><h2>Today\'s work</h2>' + btn('Report hazard', 'report-hazard', '', 'warn') + '</div>' +
          (active.length ? active.map(function (w) { return wpRow(w, u); }).join('') : empty('No active work packages right now.')) + '</div>' +
        '<div class="block"><div class="block__head"><h2>My Digital Passport</h2>' + btn('View all', 'nav-passport', '', 'ghost') + '</div>' +
          creds.slice(0, 4).map(function (c) { return credLine(c); }).join('') + '</div>' +
      '</div></div>';
  }

  function dashSupervisor(u) {
    var review = DB.WORK_PACKAGES.filter(function (w) { return w.status === 'submitted' || w.status === 'under_review'; });
    var onsite = DB.CREW.filter(function (c) { return c.onSite && c.role === 'worker'; });
    var openHaz = DB.HAZARDS.filter(function (h) { return h.status !== 'resolved'; });
    return '<div class="page">' +
      '<div class="statrow">' +
        statCard('Crew on site', onsite.length, 'of ' + DB.CREW.filter(function (c){return c.role==='worker';}).length + ' assigned', 'users', 'blue') +
        statCard('Awaiting review', review.length, 'work packages', 'task', 'amber') +
        statCard('Open hazards', openHaz.length, openHaz.filter(function(h){return h.severity==='high';}).length + ' high severity', 'hazard', 'red') +
        statCard('Milestones', DB.PROJECT.milestonesDone + '/' + DB.PROJECT.milestonesTotal, 'this project', 'check', 'green') +
      '</div>' +
      '<div class="grid2">' +
        '<div class="block"><div class="block__head"><h2>Awaiting your review</h2>' + btn('New work package', 'new-wp', '', 'primary') + '</div>' +
          (review.length ? review.map(function (w) { return wpRow(w, u); }).join('') : empty('Nothing awaiting review — nicely done.')) + '</div>' +
        '<div class="block"><div class="block__head"><h2>Open hazards</h2>' + btn('All hazards', 'nav-hazards', '', 'ghost') + '</div>' +
          (openHaz.length ? openHaz.map(function (h) { return hazardRow(h, u); }).join('') : empty('No open hazards.')) + '</div>' +
      '</div>' +
      '<div class="block"><div class="block__head"><h2>Crew on site now</h2></div>' + crewStrip(onsite) + '</div>' +
    '</div>';
  }

  function dashSafety(u) {
    var open = DB.HAZARDS.filter(function (h) { return h.status === 'open'; });
    var prog = DB.HAZARDS.filter(function (h) { return h.status === 'in_progress'; });
    var high = DB.HAZARDS.filter(function (h) { return h.severity === 'high' && h.status !== 'resolved'; });
    var resolvedToday = DB.HAZARDS.filter(function (h) { return h.status === 'resolved'; });
    var queue = DB.HAZARDS.filter(function (h) { return h.status !== 'resolved'; }).sort(function (a, b) { return (a.severity === 'high' ? -1 : 1); });
    var credAlerts = credAlertList();
    return '<div class="page">' +
      '<div class="statrow">' +
        statCard('Open hazards', open.length, 'need triage', 'hazard', 'red') +
        statCard('In progress', prog.length, 'being actioned', 'clock', 'amber') +
        statCard('High severity', high.length, 'priority', 'shield', 'red') +
        statCard('Resolved', resolvedToday.length, 'closed out', 'check', 'green') +
      '</div>' +
      '<div class="grid2">' +
        '<div class="block"><div class="block__head"><h2>Hazard response queue</h2>' + badge(queue.length + ' active', 'amber-soft') + '</div>' +
          (queue.length ? queue.map(function (h) { return hazardRow(h, u); }).join('') : empty('Queue is clear.')) + '</div>' +
        '<div class="block"><div class="block__head"><h2>Compliance alerts</h2>' + btn('Compliance', 'nav-credentials', '', 'ghost') + '</div>' +
          (credAlerts.length ? credAlerts.join('') : empty('All credentials current.')) + '</div>' +
      '</div></div>';
  }

  function dashPM(u) {
    var p = DB.PROJECT;
    var flags = DB.WORK_PACKAGES.filter(function (w) { return w.aiFlag; });
    var counts = colCounts();
    var signoff = DB.WORK_PACKAGES.filter(function (w) { return w.status === 'under_review' || w.status === 'submitted'; });
    return '<div class="page">' +
      '<div class="statrow">' +
        statCard('Project progress', p.progress + '%', p.name, 'chart', 'blue') +
        statCard('Budget', '$' + p.spent + 'M', 'of $' + p.budget + 'M', 'chart', 'green') +
        statCard('Milestones', p.milestonesDone + '/' + p.milestonesTotal, 'completed', 'check', 'indigo') +
        statCard('Deadline', p.daysToDeadline + 'd', 'remaining', 'cal', 'amber') +
      '</div>' +
      '<div class="grid2">' +
        '<div class="block block--ai"><div class="block__head"><h2>' + icon('spark') + ' AI advisory</h2>' + badge('Human decision required', 'cyan-soft') + '</div>' +
          (flags.length ? flags.map(function (w) { return '<div class="aiflag"><div><strong>' + w.id + '</strong> · ' + esc(w.title) + '<p>' + esc(w.aiFlag) + '</p></div>' + btn('Review', 'open-wp', w.id, 'primary') + '</div>'; }).join('') : empty('No risks flagged.')) + '</div>' +
        '<div class="block"><div class="block__head"><h2>Delivery pipeline</h2>' + btn('New work package', 'new-wp', '', 'primary') + '</div>' + pipeline(counts) +
          '<div class="block__sub">Pending sign-off</div>' + (signoff.length ? signoff.map(function (w) { return wpRow(w, u); }).join('') : empty('Nothing pending.')) + '</div>' +
      '</div></div>';
  }

  function dashLogistics(u) {
    var onsite = DB.CREW.filter(function (c) { return c.onSite; });
    var avail = DB.CREW.filter(function (c) { return !c.onSite && c.role === 'worker'; });
    var zones = {};
    DB.CREW.forEach(function (c) { if (c.onSite) zones[c.zone] = (zones[c.zone] || 0) + 1; });
    var zoneRows = Object.keys(zones).map(function (z) { return '<div class="zoneline"><span>' + icon('pin') + esc(z) + '</span><div class="zonebar"><span style="width:' + Math.min(100, zones[z] * 25) + '%"></span></div><b>' + zones[z] + '</b></div>'; }).join('');
    return '<div class="page">' +
      '<div class="statrow">' +
        statCard('On site', onsite.length, 'workers active', 'users', 'green') +
        statCard('Available', avail.length, 'can be deployed', 'route', 'blue') +
        statCard('Active zones', Object.keys(zones).length, 'with crew', 'pin', 'indigo') +
        statCard('Reassignments', '2', 'today', 'route', 'amber') +
      '</div>' +
      '<div class="grid2">' +
        '<div class="block"><div class="block__head"><h2>Workforce by zone</h2></div>' + (zoneRows || empty('No crew on site.')) + '</div>' +
        '<div class="block"><div class="block__head"><h2>Available to deploy</h2>' + btn('Workforce', 'nav-people', '', 'ghost') + '</div>' + crewStrip(avail) + '</div>' +
      '</div></div>';
  }

  function dashAdmin(u) {
    var alerts = credAlertList();
    var todayAudit = DB.AUDIT.slice(0, 5);
    return '<div class="page">' +
      '<div class="statrow">' +
        statCard('Active users', DB.USERS.length, 'across roles', 'users', 'blue') +
        statCard('Roles', Object.keys(SEED.ROLES).length, 'with RBAC', 'shield', 'indigo') +
        statCard('Credential alerts', alerts.length, 'need attention', 'id', 'amber') +
        statCard('Audit events', DB.AUDIT.length, 'logged today', 'list', 'slate') +
      '</div>' +
      '<div class="grid2">' +
        '<div class="block"><div class="block__head"><h2>Recent activity</h2>' + btn('Full audit log', 'nav-audit', '', 'ghost') + '</div>' + auditTable(todayAudit) + '</div>' +
        '<div class="block"><div class="block__head"><h2>Credential &amp; access alerts</h2>' + btn('Queue', 'nav-credentials', '', 'ghost') + '</div>' + (alerts.length ? alerts.join('') : empty('No alerts.')) + '</div>' +
      '</div></div>';
  }

  /* ---------------- work packages page ---------------- */
  function colCounts() {
    var c = { assigned: 0, progress: 0, review: 0, done: 0 };
    DB.WORK_PACKAGES.forEach(function (w) { c[WP[w.status].col]++; });
    return c;
  }
  function pipeline(c) {
    var cols = [['assigned', 'Assigned', 'gray'], ['progress', 'In progress', 'blue'], ['review', 'Review', 'amber'], ['done', 'Done', 'green']];
    return '<div class="pipeline">' + cols.map(function (k) { return '<div class="pipe pipe--' + k[2] + '"><span class="pipe__n">' + c[k[0]] + '</span><span class="pipe__l">' + k[1] + '</span></div>'; }).join('') + '</div>';
  }
  function workPage(u) {
    var list = DB.WORK_PACKAGES;
    if (u.role === 'worker') list = list.filter(function (w) { return w.assignee === u.id; });
    var f = state.ui.wpFilter;
    var filtered = f === 'all' ? list : list.filter(function (w) { return WP[w.status].col === f; });
    var filters = ['all', 'assigned', 'progress', 'review', 'done'].map(function (k) {
      var lbl = { all: 'All', assigned: 'Assigned', progress: 'In progress', review: 'Review', done: 'Done' }[k];
      return '<button class="chipfilter' + (f === k ? ' is-on' : '') + '" data-action="wpfilter" data-f="' + k + '">' + lbl + '</button>';
    }).join('');
    var canCreate = (u.role === 'supervisor' || u.role === 'pm' || u.role === 'logistics');
    return '<div class="page">' +
      '<div class="toolbar"><div class="chipfilters">' + filters + '</div>' + (canCreate ? btn('New work package', 'new-wp', '', 'primary') : '') + '</div>' +
      (u.role === 'pm' || u.role === 'supervisor' ? '<div class="block" style="margin-bottom:18px">' + pipeline(colCounts()) + '</div>' : '') +
      '<div class="block">' + (filtered.length ? filtered.map(function (w) { return wpRow(w, u); }).join('') : empty('No work packages in this view.')) + '</div>' +
    '</div>';
  }

  /* ---------------- check-in page ---------------- */
  function checkinPage(u) {
    if (u.role !== 'worker') {
      var onsite = DB.CREW.filter(function (c) { return c.onSite; });
      return '<div class="page"><div class="block"><div class="block__head"><h2>Who\'s on site — ' + esc(u.site) + '</h2>' + badge(onsite.length + ' active', 'green-soft') + '</div>' + crewStrip(onsite) + '</div>' + siteMap() + '</div>';
    }
    var creds = DB.CREDENTIALS[u.id] || [];
    return '<div class="page"><div class="grid2">' +
      '<div class="block checkin"><div class="checkin__map">' + siteMap() + '</div>' +
        '<div class="checkin__panel ' + (u.checkedIn ? 'in' : 'out') + '">' +
          '<span class="checkin__status">' + icon(u.checkedIn ? 'check' : 'pin') + (u.checkedIn ? 'Checked in' : 'Not checked in') + '</span>' +
          '<h2>' + esc(u.site) + '</h2><p>' + (u.checkedIn ? 'Zone ' + esc(u.zone) + ' · since ' + esc(u.checkinTime) : 'GPS confirms you are within the site geofence.') + '</p>' +
          '<div class="checkin__gps">' + icon('pin') + ' GPS location verified · accuracy 4m</div>' +
          '<button class="btn btn--' + (u.checkedIn ? 'ghost' : 'primary') + ' btn--block" data-action="' + (u.checkedIn ? 'checkout' : 'checkin') + '">' + (u.checkedIn ? 'Check out of site' : 'Check in to site') + '</button>' +
        '</div></div>' +
      '<div class="block"><div class="block__head"><h2>Access requirements</h2></div>' +
        '<p class="muted" style="margin-bottom:12px">Your credentials are checked automatically at check-in.</p>' +
        creds.map(function (c) { return credLine(c); }).join('') + '</div>' +
    '</div></div>';
  }
  function siteMap() {
    return '<svg class="sitemap" viewBox="0 0 320 180" role="img" aria-label="Site map">' +
      '<rect x="0" y="0" width="320" height="180" rx="14" fill="#0f1525"/>' +
      '<g stroke="rgba(34,211,238,.18)" stroke-width="1"><path d="M0 60H320M0 120H320M80 0V180M160 0V180M240 0V180"/></g>' +
      '<path d="M40 130 L120 95 L210 130 L130 165 Z" fill="rgba(79,70,229,.25)" stroke="rgba(147,197,253,.6)"/>' +
      '<circle cx="120" cy="95" r="6" fill="#34d399"><animate attributeName="opacity" values="1;.4;1" dur="2.2s" repeatCount="indefinite"/></circle>' +
      '<circle cx="210" cy="118" r="5" fill="#fb923c"><animate attributeName="opacity" values="1;.4;1" dur="1.4s" repeatCount="indefinite"/></circle>' +
      '<circle cx="70" cy="120" r="5" fill="#34d399"/><circle cx="250" cy="70" r="5" fill="#34d399"/>' +
      '<text x="120" y="80" fill="#93c5fd" font-size="9" text-anchor="middle">Zone B · you</text>' +
    '</svg>';
  }

  /* ---------------- hazards page ---------------- */
  function hazardsPage(u) {
    var f = state.ui.hzFilter;
    var list = f === 'all' ? DB.HAZARDS : DB.HAZARDS.filter(function (h) { return h.status === f; });
    var filters = ['all', 'open', 'in_progress', 'resolved'].map(function (k) {
      var lbl = { all: 'All', open: 'Open', in_progress: 'In progress', resolved: 'Resolved' }[k];
      return '<button class="chipfilter' + (f === k ? ' is-on' : '') + '" data-action="hzfilter" data-f="' + k + '">' + lbl + '</button>';
    }).join('');
    return '<div class="page">' +
      '<div class="toolbar"><div class="chipfilters">' + filters + '</div>' + btn('Report hazard', 'report-hazard', '', 'warn') + '</div>' +
      '<div class="block">' + (list.length ? list.map(function (h) { return hazardRow(h, u); }).join('') : empty('No hazards in this view.')) + '</div>' +
    '</div>';
  }

  /* ---------------- passport ---------------- */
  function credLine(c) {
    var cls = c.status === 'valid' ? 'green' : c.status === 'expiring' ? 'amber' : 'red';
    var lbl = c.status === 'valid' ? 'Valid' : c.status === 'expiring' ? 'Expiring' : 'Invalid';
    return '<div class="credline"><span class="credline__ic credline__ic--' + cls + '">' + icon('id') + '</span>' +
      '<div class="credline__b"><strong>' + esc(c.type) + '</strong><small>' + esc(c.ref) + ' · expires ' + esc(c.expiry) + '</small></div>' + badge(lbl, cls) + '</div>';
  }
  function passportPage(u) {
    var creds = DB.CREDENTIALS[u.id] || [];
    return '<div class="page">' +
      '<div class="passhead"><div class="passhead__id">' + av(u.initials, u.role) + '<div><strong>' + esc(u.name) + '</strong><small>USI · ' + esc(u.id.toUpperCase()) + ' · ' + esc(u.trade || SEED.ROLES[u.role].label) + '</small></div></div>' + badge('Identity verified', 'green') + '</div>' +
      '<div class="block"><div class="block__head"><h2>Credentials &amp; licences</h2>' + btn('Add credential', 'add-cred', '', 'primary') + '</div>' +
        creds.map(function (c) { return credLine(c); }).join('') + '</div>' +
    '</div>';
  }

  /* ---------------- credential queue (admin/safety) ---------------- */
  function credAlertList() {
    var out = [];
    DB.CREW.forEach(function (c) {
      if (c.credentials === 'expiring') out.push(alertLine(c.initials, c.role, c.name, 'Credential expiring soon', 'amber'));
      if (c.credentials === 'invalid') out.push(alertLine(c.initials, c.role, c.name, 'Invalid / expired credential', 'red'));
    });
    return out;
  }
  function alertLine(ini, role, name, msg, cls) {
    return '<div class="credline"><span class="credline__ic credline__ic--' + cls + '">' + icon('id') + '</span><div class="credline__b"><strong>' + esc(name) + '</strong><small>' + esc(msg) + '</small></div>' + btn('Send renewal', 'send-renewal', '', 'ghost') + '</div>';
  }
  function credentialQueue(u) {
    var rows = DB.CREW.map(function (c) {
      var cls = c.credentials === 'valid' ? 'green' : c.credentials === 'expiring' ? 'amber' : 'red';
      var lbl = c.credentials === 'valid' ? 'Verified' : c.credentials === 'expiring' ? 'Expiring' : 'Action needed';
      return '<tr><td>' + av(c.initials, c.role, true) + ' ' + esc(c.name) + '</td><td>' + esc(c.trade) + '</td><td>' + esc(c.zone) + '</td><td>' + badge(lbl, cls) + '</td>' +
        '<td class="ta-r">' + (c.credentials === 'valid' ? btn('View', 'noop', '', 'ghost') : btn('Send renewal', 'send-renewal', '', 'primary')) + '</td></tr>';
    }).join('');
    return '<div class="page"><div class="block"><div class="block__head"><h2>Credential compliance — ' + esc(u.site) + '</h2>' + badge(credAlertList().length + ' alerts', 'amber-soft') + '</div>' +
      '<table class="table"><thead><tr><th>Worker</th><th>Trade</th><th>Zone</th><th>Status</th><th class="ta-r">Action</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  /* ---------------- people ---------------- */
  function crewStrip(list) {
    if (!list.length) return empty('No one here right now.');
    return '<div class="crewstrip">' + list.map(function (c) {
      return '<div class="crewcard"><span class="crewcard__dot ' + (c.onSite ? 'on' : 'off') + '"></span>' + av(c.initials, c.role, true) +
        '<div><strong>' + esc(c.name) + '</strong><small>' + esc(c.trade) + ' · ' + esc(c.zone) + '</small></div></div>';
    }).join('') + '</div>';
  }
  function peoplePage(u) {
    var rows = DB.CREW.map(function (c) {
      var cls = c.credentials === 'valid' ? 'green' : c.credentials === 'expiring' ? 'amber' : 'red';
      return '<tr><td>' + av(c.initials, c.role, true) + ' ' + esc(c.name) + '</td><td>' + esc(SEED.ROLES[c.role].label) + '</td><td>' + esc(c.trade) + '</td><td>' + esc(c.zone) + '</td>' +
        '<td>' + (c.onSite ? badge('On site', 'green') : badge('Off site', 'slate')) + '</td><td>' + badge(c.credentials === 'valid' ? 'Valid' : c.credentials === 'expiring' ? 'Expiring' : 'Invalid', cls) + '</td></tr>';
    }).join('');
    var onsite = DB.CREW.filter(function (c) { return c.onSite; }).length;
    return '<div class="page"><div class="statrow">' +
        statCard('Total workforce', DB.CREW.length, 'on this site', 'users', 'blue') +
        statCard('On site now', onsite, 'checked in', 'pin', 'green') +
        statCard('Off site', DB.CREW.length - onsite, 'not checked in', 'route', 'slate') +
        statCard('Credential alerts', credAlertList().length, 'need attention', 'id', 'amber') +
      '</div><div class="block"><div class="block__head"><h2>Workforce directory</h2></div>' +
      '<table class="table"><thead><tr><th>Name</th><th>Role</th><th>Trade</th><th>Zone</th><th>Status</th><th>Credentials</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  /* ---------------- users & roles (admin RBAC) ---------------- */
  function usersRoles(u) {
    var userRows = DB.USERS.map(function (x) { var r = SEED.ROLES[x.role]; return '<tr><td>' + av(x.initials, x.role, true) + ' ' + esc(x.name) + '</td><td>' + esc(x.email) + '</td><td>' + badge(r.label, 'slate-soft') + '</td><td>' + esc(x.site) + '</td><td class="ta-r">' + badge('Active', 'green') + '</td></tr>'; }).join('');
    var roles = Object.keys(SEED.ROLES);
    var header = '<tr><th>Permission</th>' + roles.map(function (rk) { return '<th class="ta-c">' + SEED.ROLES[rk].short + '</th>'; }).join('') + '</tr>';
    var matrix = SEED.PERMISSIONS.map(function (p) {
      return '<tr><td>' + esc(p.label) + '</td>' + roles.map(function (rk) {
        var on = DB.ROLE_PERMS[rk][p.key];
        return '<td class="ta-c"><button class="toggle ' + (on ? 'on' : '') + '" data-action="toggle-perm" data-role="' + rk + '" data-perm="' + p.key + '" aria-pressed="' + on + '"></button></td>';
      }).join('') + '</tr>';
    }).join('');
    return '<div class="page">' +
      '<div class="block"><div class="block__head"><h2>Users</h2>' + btn('Invite user', 'noop', '', 'primary') + '</div>' +
        '<table class="table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Site</th><th class="ta-r">Status</th></tr></thead><tbody>' + userRows + '</tbody></table></div>' +
      '<div class="block"><div class="block__head"><h2>Role-based access control</h2>' + badge('RBAC matrix', 'indigo-soft') + '</div>' +
        '<p class="muted" style="margin-bottom:12px">Toggle what each role can do. Changes apply across the platform and are written to the audit log.</p>' +
        '<table class="table table--matrix"><thead>' + header + '</thead><tbody>' + matrix + '</tbody></table></div>' +
    '</div>';
  }

  /* ---------------- audit ---------------- */
  function auditTable(rows) {
    return '<table class="table table--audit"><tbody>' + rows.map(function (a) {
      return '<tr><td class="audit__time">' + esc(a.time) + '</td><td>' + badge(a.type, audTone(a.type) + '-soft') + '</td><td><strong>' + esc(a.actor) + '</strong> ' + esc(a.action) + '</td><td class="audit__target">' + esc(a.target) + '</td></tr>';
    }).join('') + '</tbody></table>';
  }
  function audTone(t) { return { access: 'green', work: 'blue', safety: 'amber', security: 'red', admin: 'indigo' }[t] || 'slate'; }
  function auditPage(u) { return '<div class="page"><div class="block"><div class="block__head"><h2>Audit log — ' + esc(u.site) + '</h2>' + badge(DB.AUDIT.length + ' events', 'slate-soft') + '</div>' + auditTable(DB.AUDIT) + '</div></div>'; }

  /* ---------------- settings (admin) ---------------- */
  function settingsPage() {
    var toggles = [['Require MFA at sign-in', true], ['Enforce GPS geofence on check-in', true], ['Auto-pause work on linked hazard', true], ['Australian data residency', true], ['AI advisory risk flags', true], ['Allow check-in outside geofence (override)', false]];
    return '<div class="page"><div class="grid2">' +
      '<div class="block"><div class="block__head"><h2>Platform settings</h2></div>' + toggles.map(function (t) { return '<div class="setrow"><span>' + t[0] + '</span><button class="toggle ' + (t[1] ? 'on' : '') + '" data-action="noop"></button></div>'; }).join('') + '</div>' +
      '<div class="block"><div class="block__head"><h2>Site</h2></div><div class="setrow"><span>Active site</span><b>Barangaroo C3</b></div><div class="setrow"><span>Client</span><b>Lendlease</b></div><div class="setrow"><span>Data region</span><b>Australia (Sydney)</b></div><div class="setrow"><span>Plan</span><b>Enterprise · Prototype</b></div></div>' +
    '</div></div>';
  }

  /* ---------------- notifications ---------------- */
  function notificationsPage(u) {
    var list = DB.NOTIFICATIONS.filter(function (n) { return n.roles.indexOf(u.role) !== -1; });
    return '<div class="page"><div class="block"><div class="block__head"><h2>Notifications</h2>' + btn('Mark all read', 'mark-read', '', 'ghost') + '</div>' +
      (list.length ? list.map(function (n) { return '<div class="notif notif--row' + (n.read ? '' : ' notif--unread') + '"><span class="notif__ic notif__ic--' + n.icon + '">' + icon(n.icon) + '</span><div><p>' + n.text + '</p><small>' + esc(n.time) + '</small></div></div>'; }).join('') : empty('No notifications.')) + '</div></div>';
  }

  function empty(msg) { return '<div class="emptystate">' + icon('check') + '<p>' + esc(msg) + '</p></div>'; }

  /* ============================================================
     MODALS
     ============================================================ */
  function reportHazardModal() {
    openModal('<div class="modal__head"><h3>' + icon('hazard') + ' Report a hazard</h3><button class="iconbtn" data-action="close-modal">' + icon('x') + '</button></div>' +
      '<form id="hazForm" class="modal__body form">' +
        '<label class="fl">Hazard title<input id="hzTitle" placeholder="e.g. Exposed rebar near walkway" required/></label>' +
        '<div class="form__row"><label class="fl">Zone / location<input id="hzZone" placeholder="e.g. Level 4 — East" required/></label>' +
        '<label class="fl">Severity<select id="hzSev"><option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option></select></label></div>' +
        '<label class="fl">Description<textarea id="hzDesc" rows="3" placeholder="What is the hazard and the risk?"></textarea></label>' +
        '<label class="uploader"><input type="file" hidden/>' + icon('cam') + '<span>Attach geo-tagged photo evidence (optional)</span></label>' +
      '</form>' +
      '<div class="modal__foot"><button class="btn btn--ghost" data-action="close-modal">Cancel</button><button class="btn btn--warn" data-action="submit-hazard">Submit report</button></div>');
  }
  function newWpModal() {
    var opts = DB.CREW.filter(function (c) { return c.role === 'worker'; }).map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + ' · ' + esc(c.trade) + '</option>'; }).join('');
    openModal('<div class="modal__head"><h3>' + icon('task') + ' New work package</h3><button class="iconbtn" data-action="close-modal">' + icon('x') + '</button></div>' +
      '<form id="wpForm" class="modal__body form">' +
        '<label class="fl">Title<input id="wpTitle" placeholder="e.g. Rebar fixing — Level 3 slab" required/></label>' +
        '<div class="form__row"><label class="fl">Zone<input id="wpZone" placeholder="e.g. Level 3"/></label><label class="fl">Assign to<select id="wpAssignee">' + opts + '</select></label></div>' +
        '<div class="form__row"><label class="fl">Priority<select id="wpPriority"><option>High</option><option selected>Medium</option><option>Low</option></select></label><label class="fl">Due date<input id="wpDue" type="date"/></label></div>' +
        '<label class="fl">Milestone<input id="wpMilestone" placeholder="e.g. L3 slab"/></label>' +
      '</form>' +
      '<div class="modal__foot"><button class="btn btn--ghost" data-action="close-modal">Cancel</button><button class="btn btn--primary" data-action="save-wp">Create &amp; assign</button></div>');
  }
  function logModal(id) {
    var w = byId(DB.WORK_PACKAGES, id); if (!w) return;
    openModal('<div class="modal__head"><h3>' + icon('task') + ' Submit work log · ' + w.id + '</h3><button class="iconbtn" data-action="close-modal">' + icon('x') + '</button></div>' +
      '<form id="logForm" class="modal__body form">' +
        '<div class="modal__wpinfo"><strong>' + esc(w.title) + '</strong><span>' + icon('pin') + esc(w.zone) + ' · ' + esc(w.milestone) + '</span></div>' +
        '<label class="fl">Work completed<textarea id="logText" rows="4" placeholder="Describe the work done, hours, and any notes…" required>' + esc(w.status === 'rejected' ? '' : '') + '</textarea></label>' +
        '<label class="uploader"><input type="file" hidden/>' + icon('cam') + '<span>Attach completion evidence (photos)</span></label>' +
      '</form>' +
      '<div class="modal__foot"><button class="btn btn--ghost" data-action="close-modal">Cancel</button><button class="btn btn--primary" data-action="save-log" data-id="' + id + '">Submit for review</button></div>');
  }
  function wpDetailModal(id) {
    var w = byId(DB.WORK_PACKAGES, id); if (!w) return; var s = WP[w.status]; var u = state.user;
    var steps = ['pending', 'credential', 'in_progress', 'submitted', 'under_review', 'approved'];
    var idx = { pending: 0, credential_failed: 1, in_progress: 2, rejected: 2, paused: 2, submitted: 3, under_review: 4, approved: 5, closed: 5 }[w.status];
    var stepLbls = ['Pending', 'Credential', 'In progress', 'Submitted', 'Review', 'Approved'];
    var flow = '<div class="wpflow">' + stepLbls.map(function (l, i) { return '<div class="wpflow__s ' + (i < idx ? 'done' : i === idx ? 'now' : '') + '"><span>' + (i < idx ? icon('check') : (i + 1)) + '</span><small>' + l + '</small></div>'; }).join('') + '</div>';
    openModal('<div class="modal__head"><h3>' + w.id + ' · ' + esc(w.title) + '</h3><button class="iconbtn" data-action="close-modal">' + icon('x') + '</button></div>' +
      '<div class="modal__body">' + flow +
        '<div class="kv"><div><small>Status</small>' + badge(s.label, s.cls) + '</div><div><small>Priority</small><b>' + esc(w.priority) + '</b></div><div><small>Zone</small><b>' + esc(w.zone) + '</b></div><div><small>Due</small><b>' + esc(w.due) + '</b></div><div><small>Assignee</small><b>' + esc(w.assigneeName) + '</b></div><div><small>Milestone</small><b>' + esc(w.milestone) + '</b></div></div>' +
        (w.aiFlag ? '<div class="aiflag aiflag--inline">' + icon('spark') + '<p>' + esc(w.aiFlag) + '</p></div>' : '') +
        (w.note ? '<div class="notebox">' + icon('hazard') + esc(w.note) + '</div>' : '') +
        (w.workLog ? '<div class="logbox"><small>Work log</small><p>' + esc(w.workLog) + '</p>' + (w.evidence ? '<span class="evidence">' + icon('cam') + w.evidence + ' photo evidence</span>' : '') + '</div>' : '') +
      '</div>' +
      '<div class="modal__foot">' + wpActions(w, u).replace('rowactions', 'rowactions rowactions--modal') + '</div>');
  }

  /* ============================================================
     ACTIONS (event delegation)
     ============================================================ */
  function audit(actor, action, target, type) { DB.AUDIT.unshift({ time: nowTime(), actor: actor, action: action, target: target, type: type }); }
  function nowTime() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-action]'); if (!t) {
      // click outside dropdowns closes them
      if (state.user && (state.ui.notif || state.ui.menu)) { state.ui.notif = state.ui.menu = false; renderApp(); }
      return;
    }
    var a = t.getAttribute('data-action'); var id = t.getAttribute('data-id'); var u = state.user;
    switch (a) {
      case 'login': login(t.getAttribute('data-user')); break;
      case 'logout': logout(); break;
      case 'nav': state.route = t.getAttribute('data-route'); state.ui.sidebar = false; renderApp(); break;
      case 'nav-passport': state.route = 'passport'; renderApp(); break;
      case 'nav-hazards': state.route = 'hazards'; renderApp(); break;
      case 'nav-credentials': state.route = 'credentials'; renderApp(); break;
      case 'nav-people': state.route = 'people'; renderApp(); break;
      case 'nav-audit': state.route = 'audit'; renderApp(); break;
      case 'toggle-sidebar': state.ui.sidebar = !state.ui.sidebar; renderApp(); break;
      case 'close-sidebar': state.ui.sidebar = false; renderApp(); break;
      case 'toggle-notif': state.ui.notif = !state.ui.notif; state.ui.menu = false; renderApp(); break;
      case 'toggle-menu': state.ui.menu = !state.ui.menu; state.ui.notif = false; renderApp(); break;
      case 'mark-read': DB.NOTIFICATIONS.forEach(function (n) { n.read = true; }); toast('All notifications marked read'); renderApp(); break;
      case 'checkin': u.checkedIn = true; u.checkinTime = nowTime(); audit(u.name, 'Site check-in approved', u.zone, 'access'); toast('Checked in · credentials verified'); renderApp(); break;
      case 'checkout': u.checkedIn = false; audit(u.name, 'Site check-out', u.zone, 'access'); toast('Checked out · work session closed'); renderApp(); break;
      case 'report-hazard': reportHazardModal(); break;
      case 'submit-hazard': submitHazard(); break;
      case 'new-wp': newWpModal(); break;
      case 'save-wp': saveWp(); break;
      case 'open-wp': wpDetailModal(id); break;
      case 'open-haz': hazDetail(id); break;
      case 'start-wp': startWp(id); break;
      case 'renew-wp': renewWp(id); break;
      case 'log-wp': logModal(id); break;
      case 'save-log': saveLog(id); break;
      case 'approve-wp': approveWp(id); break;
      case 'reject-wp': rejectWp(id); break;
      case 'resume-wp': resumeWp(id); break;
      case 'advance-haz': advanceHaz(id); break;
      case 'resolve-haz': resolveHaz(id); break;
      case 'toggle-perm': togglePerm(t.getAttribute('data-role'), t.getAttribute('data-perm')); break;
      case 'wpfilter': state.ui.wpFilter = t.getAttribute('data-f'); renderApp(); break;
      case 'hzfilter': state.ui.hzFilter = t.getAttribute('data-f'); renderApp(); break;
      case 'add-cred': toast('Upload a credential — verification runs automatically', 'ok'); break;
      case 'send-renewal': toast('Renewal reminder sent to worker'); break;
      case 'auth-tab':
        state.ui.authTab = t.getAttribute('data-tab');
        document.querySelectorAll('.authtab').forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-tab') === state.ui.authTab); });
        document.querySelectorAll('.authpanel').forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-panel') === state.ui.authTab); });
        break;
      case 'toggle-pw': {
        var pw = document.getElementById(t.getAttribute('data-target'));
        if (pw) { var showing = pw.type === 'password'; pw.type = showing ? 'text' : 'password'; var use = t.querySelector('use'); if (use) use.setAttribute('href', showing ? '#i-eye-off' : '#i-eye'); t.setAttribute('aria-label', showing ? 'Hide password' : 'Show password'); }
        break;
      }
      case 'reset-demo':
        clearMemory(); reset(); rememberMe = false;
        renderLogin(); toast('Demo data reset to defaults'); break;
      case 'close-modal': closeModal(); break;
      case 'noop': e.preventDefault && e.preventDefault(); break;
    }
  });

  /* ---- work package transitions ---- */
  function startWp(id) {
    var w = byId(DB.WORK_PACKAGES, id); if (!w) return;
    // credential gate
    var creds = DB.CREDENTIALS[w.assignee];
    var ok = !creds || creds.every(function (c) { return c.status !== 'invalid'; });
    if (!ok) { w.status = 'credential_failed'; toast('Credential check failed — renew to proceed', 'error'); }
    else { w.status = 'in_progress'; toast('Credentials verified · task started', 'ok'); audit(state.user.name, 'Started work package', w.id, 'work'); }
    renderApp();
  }
  function renewWp(id) { var w = byId(DB.WORK_PACKAGES, id); if (!w) return; w.status = 'pending'; toast('Credential renewed · ready to start'); audit(state.user.name, 'Renewed credential', w.id, 'security'); renderApp(); }
  function saveLog(id) {
    var w = byId(DB.WORK_PACKAGES, id); if (!w) return;
    var txt = ($('#logText') || {}).value || '';
    if (!txt.trim()) { toast('Add a short work log before submitting', 'error'); return; }
    w.workLog = txt.trim(); w.status = 'submitted'; w.evidence = (w.evidence || 0) + 1;
    DB.NOTIFICATIONS.unshift({ id: 'n' + Date.now(), icon: 'task', text: 'Work package <b>' + w.id + '</b> submitted for review.', time: 'Just now', roles: ['supervisor', 'pm'], read: false });
    audit(state.user.name, 'Submitted work log', w.id, 'work');
    closeModal(); toast('Submitted for supervisor review'); renderApp();
  }
  function approveWp(id) { var w = byId(DB.WORK_PACKAGES, id); if (!w) return; w.status = 'approved'; audit(state.user.name, 'Approved milestone', w.id + ' · ' + w.milestone, 'work'); closeModal(); toast('Milestone approved · signed off'); renderApp(); }
  function rejectWp(id) { var w = byId(DB.WORK_PACKAGES, id); if (!w) return; w.status = 'rejected'; DB.NOTIFICATIONS.unshift({ id: 'n' + Date.now(), icon: 'task', text: 'Rework requested on <b>' + w.id + '</b>.', time: 'Just now', roles: ['worker'], read: false }); audit(state.user.name, 'Requested rework', w.id, 'work'); closeModal(); toast('Rework requested', 'warn'); renderApp(); }
  function resumeWp(id) { var w = byId(DB.WORK_PACKAGES, id); if (!w) return; w.status = 'in_progress'; audit(state.user.name, 'Resumed work package', w.id, 'work'); toast('Work resumed'); renderApp(); }

  /* ---- hazard transitions ---- */
  function advanceHaz(id) { var h = byId(DB.HAZARDS, id); if (!h) return; h.status = 'in_progress'; audit(state.user.name, 'Started hazard response', h.id, 'safety'); toast('Response started'); renderApp(); }
  function resolveHaz(id) {
    var h = byId(DB.HAZARDS, id); if (!h) return; h.status = 'resolved';
    if (h.linkedWp) { var w = byId(DB.WORK_PACKAGES, h.linkedWp); if (w && w.status === 'paused') { w.status = 'in_progress'; } }
    audit(state.user.name, 'Resolved hazard', h.id, 'safety'); toast('Hazard resolved' + (h.linkedWp ? ' · linked work resumed' : '')); renderApp();
  }
  function hazDetail(id) {
    var h = byId(DB.HAZARDS, id); if (!h) return; var u = state.user;
    var acts = [];
    if ((u.role === 'safety' || u.role === 'supervisor')) {
      if (h.status === 'open') acts.push(btn('Start response', 'advance-haz', h.id, 'primary'));
      if (h.status === 'in_progress') acts.push(btn('Mark resolved', 'resolve-haz', h.id, 'primary'));
    }
    acts.push(btn('Close', 'close-modal', '', 'ghost'));
    openModal('<div class="modal__head"><h3>' + h.id + ' · ' + esc(h.title) + '</h3><button class="iconbtn" data-action="close-modal">' + icon('x') + '</button></div>' +
      '<div class="modal__body"><div class="hzdetail"><div class="hzdetail__row">' + badge(h.severity, SEV[h.severity] + '-soft') + badge(HZ[h.status].label, HZ[h.status].cls) + '</div>' +
        '<div class="kv"><div><small>Zone</small><b>' + esc(h.zone) + '</b></div><div><small>Reported by</small><b>' + esc(h.reportedBy) + '</b></div><div><small>When</small><b>' + esc(h.time) + '</b></div>' + (h.linkedWp ? '<div><small>Linked work</small><b>' + esc(h.linkedWp) + ' (paused)</b></div>' : '') + '</div>' +
        '<p class="hzdetail__desc">' + esc(h.desc) + '</p>' + (h.photo ? '<div class="photoph">' + icon('cam') + ' Geo-tagged photo evidence attached</div>' : '') + '</div></div>' +
      '<div class="modal__foot"><div class="rowactions rowactions--modal">' + acts.join('') + '</div></div>');
  }

  /* ---- forms ---- */
  function submitHazard() {
    var title = ($('#hzTitle') || {}).value || ''; if (!title.trim()) { toast('Add a hazard title', 'error'); return; }
    var h = { id: 'HZ-' + (120 + DB.HAZARDS.length), title: title.trim(), zone: ($('#hzZone').value || 'Unspecified'), severity: $('#hzSev').value, status: 'open', reportedBy: state.user.name, reporterId: state.user.id, time: 'Just now', desc: $('#hzDesc').value || '', assignedTo: 'u_sarah', photo: true };
    DB.HAZARDS.unshift(h);
    DB.NOTIFICATIONS.unshift({ id: 'n' + Date.now(), icon: 'hazard', text: 'New ' + h.severity + '-severity hazard <b>' + h.id + '</b> reported in ' + esc(h.zone) + '.', time: 'Just now', roles: ['safety', 'supervisor', 'pm'], read: false });
    audit(state.user.name, 'Reported hazard', h.id, 'safety');
    closeModal(); toast('Hazard reported · safety officer notified', 'warn'); renderApp();
  }
  function saveWp() {
    var title = ($('#wpTitle') || {}).value || ''; if (!title.trim()) { toast('Add a title', 'error'); return; }
    var aid = $('#wpAssignee').value; var who = byId(DB.CREW, aid) || { name: 'Unassigned' };
    var w = { id: 'WP-' + (2047 + DB.WORK_PACKAGES.length), title: title.trim(), site: state.user.site, zone: $('#wpZone').value || '—', assignee: aid, assigneeName: who.name, supervisor: 'u_marcus', pm: 'u_elena', priority: $('#wpPriority').value, status: 'pending', due: $('#wpDue').value || '2026-06-06', milestone: $('#wpMilestone').value || '—', workLog: '', evidence: 0 };
    DB.WORK_PACKAGES.unshift(w);
    DB.NOTIFICATIONS.unshift({ id: 'n' + Date.now(), icon: 'task', text: 'New work package <b>' + w.id + '</b> assigned to you.', time: 'Just now', roles: ['worker'], read: false });
    audit(state.user.name, 'Created work package', w.id + ' → ' + who.name, 'work');
    closeModal(); toast('Work package created & assigned'); renderApp();
  }
  function togglePerm(role, perm) {
    DB.ROLE_PERMS[role][perm] = !DB.ROLE_PERMS[role][perm];
    audit(state.user.name, 'Updated role permissions', SEED.ROLES[role].label + ' · ' + perm, 'admin');
    renderApp();
  }

  /* ============================================================
     INIT
     ============================================================ */
  reset();
  var savedDB = loadJSON(DB_KEY);          // remember all changes (work, hazards, sign-ups, RBAC, audit…)
  if (savedDB && savedDB.USERS) DB = savedDB;
  var sess = loadJSON(SESS_KEY);           // "keep me signed in" session, if the user opted in
  if (sess && sess.user && byId(DB.USERS, sess.user.id)) {
    rememberMe = true; state.user = sess.user; state.route = sess.route || 'dashboard';
    renderApp();
  } else {
    renderLogin();                         // otherwise always open on the login / sign-up page
  }
})();
