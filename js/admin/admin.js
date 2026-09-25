/* Admin panel entrypoint: live D1 data, empty demo state, and stable login. */
const adminSessionKey = 'ivbags-admin-session';
const adminUserKey = 'ivbags-admin-user';
const loginScreen = document.querySelector('#loginScreen');
const adminApp = document.querySelector('#adminApp');

function currentAdmin() {
  const username = sessionStorage.getItem(adminUserKey) || 'admin';
  const users = JSON.parse(localStorage.getItem('ivbags-admin-users') || '[]');
  if (!users.some((user) => user.username === 'admin')) {
    users.push({ name: 'Administrador', username: 'admin' });
    localStorage.setItem('ivbags-admin-users', JSON.stringify(users));
  }
  return users.find((user) => user.username === username) || { name: username };
}

function adminUsers() { return JSON.parse(localStorage.getItem('ivbags-admin-users') || '[]'); }
function isOwner() { return (sessionStorage.getItem(adminUserKey) || 'admin') === 'admin'; }

function firstName(name) {
  return String(name || 'Administrador').trim().split(/\s+/)[0] || 'Administrador';
}

function renderAdminIdentity() {
  const name = firstName(currentAdmin().name);
  const heading = document.querySelector('.admin-heading h1');
  const profile = document.querySelector('.profile-button span');
  if (heading) heading.innerHTML = `Buenos días,<br/><em>${name}.</em>`;
  if (profile) profile.innerHTML = `<span class="admin-profile-trigger" data-admin-profile-open>${name}</span><span class="admin-logout-label">· salir</span>`;
}

function addAdminNamePanel() {
  if (document.querySelector('#adminIdentityPanel')) return;
  const panel = document.createElement('section');
  panel.id = 'adminIdentityPanel';
  panel.className = 'admin-panel admin-identity-panel';
  panel.innerHTML = '<div class="panel-heading"><div><p class="admin-kicker">perfil activo</p><h2>Nombre del administrador</h2></div></div><form class="admin-name-form"><label>Nombre visible<input name="name" required placeholder="Tu primer nombre" /></label><button class="admin-primary" type="submit">Guardar nombre ↗</button><p class="customer-auth-message" role="status"></p></form>';
  document.querySelector('.admin-main')?.append(panel);
  const form = panel.querySelector('form');
  form.name.value = currentAdmin().name;
  form.addEventListener('submit', (event) => { event.preventDefault(); const users = JSON.parse(localStorage.getItem('ivbags-admin-users') || '[]'); const username = sessionStorage.getItem(adminUserKey) || 'admin'; const user = users.find((item) => item.username === username); if (user) user.name = form.name.value.trim(); localStorage.setItem('ivbags-admin-users', JSON.stringify(users)); form.querySelector('[role="status"]').textContent = 'Nombre actualizado.'; renderAdminIdentity(); });
}

function loadAdminModule(source) {
  const script = document.createElement('script');
  script.src = `${source}?v=20260925-cachefix1`;
  script.onload = () => showAdminSection('resumen');
  document.body.append(script);
}

function showAdmin() {
  loginScreen.hidden = true;
  adminApp.hidden = false;
  renderAdminIdentity();
  addAdminNamePanel();
  document.querySelector('#adminLoginCopy')?.remove();
  loadAdminModule('js/admin/admin-product-form.js');
  loadAdminModule('js/admin/admin-dashboard.js');
  loadAdminModule('js/admin/admin-delivery-details.js');
  loadAdminModule('js/admin/admin-data.js');
  loadAdminModule('js/admin/admin-records.js');
  loadAdminModule('js/admin/admin-invoice-download.js');
  loadAdminModule('js/admin/admin-preview-exact.js');
  loadAdminModule('js/admin/admin-preview-clean.js');
  loadAdminModule('js/admin/admin-profile.js');
  loadAdminModule('js/admin/admin-whatsapp.js');
  loadAdminModule('js/admin/admin-search.js');
  if (isOwner()) loadAdminModule('js/admin/admin-collaborators.js');
  setTimeout(() => showAdminSection('resumen'), 0);
  setTimeout(() => document.body.classList.add('admin-ready'), 50);
}

function showAdminSection(id) { const target = document.querySelector(`#${id}`); const container = target?.closest('.admin-main > section') || target; document.querySelectorAll('.admin-main > section').forEach((section) => { const isDashboard = id === 'resumen' && (section.id === 'resumen' || section.id === 'dashboardCharts' || section.classList.contains('stats-grid')); section.hidden = !(isDashboard || (id !== 'resumen' && section === container)); }); document.querySelectorAll('.admin-nav a').forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${id}`)); }
window.showAdminSection = showAdminSection;

if (loginScreen) {
  loginScreen.hidden = true;
  const heading = loginScreen.querySelector('h1');
  const kicker = loginScreen.querySelector('.admin-kicker');
  const user = loginScreen.querySelector('#loginUser');
  if (heading) heading.innerHTML = 'Panel<br/><em>de administración.</em>';
  if (kicker) kicker.textContent = 'acceso privado';
  if (user) user.placeholder = 'Escribe tu usuario';
}

function openAdminModal(id) {
  const modal = document.querySelector(`#${id}`);
  modal?.classList.add('open');
  modal?.setAttribute('aria-hidden', 'false');
}

function closeAdminModal(button) {
  const modal = button.closest('.admin-modal');
  modal?.classList.remove('open');
  modal?.setAttribute('aria-hidden', 'true');
}

document.querySelector('#loginForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = document.querySelector('#loginUser').value.trim();
  const password = document.querySelector('#loginPassword').value;
  const collaborator = adminUsers().find((user) => user.username === username && user.password === password);
  if ((username === 'admin' && password === '12345678') || collaborator) {
    sessionStorage.setItem(adminSessionKey, 'ok');
    sessionStorage.setItem(adminUserKey, username);
    showAdmin();
  } else {
    document.querySelector('#loginError').classList.add('visible');
  }
});

document.querySelector('#logoutButton')?.addEventListener('click', (event) => {
  if (event.target.closest('[data-admin-profile-open]')) { event.preventDefault(); showAdminSection('mi-perfil'); document.querySelector('#mi-perfil')?.scrollIntoView({ behavior: 'smooth' }); return; }
  sessionStorage.removeItem(adminSessionKey);
  sessionStorage.removeItem(adminUserKey);
  window.location.reload();
});

document.querySelectorAll('[data-open-panel]').forEach((button) => button.addEventListener('click', () => openAdminModal(button.dataset.openPanel)));
document.querySelectorAll('[data-close-panel]').forEach((button) => button.addEventListener('click', () => closeAdminModal(button)));
document.querySelectorAll('.admin-modal').forEach((modal) => modal.addEventListener('click', (event) => { if (event.target === modal) closeAdminModal(modal.querySelector('[data-close-panel]')); }));

document.querySelectorAll('.admin-nav a').forEach((link) => link.addEventListener('click', (event) => {
  const target = document.querySelector(link.getAttribute('href'));
  if (!target) return;
  event.preventDefault();
  document.querySelectorAll('.admin-nav a').forEach((item) => item.classList.remove('active'));
  link.classList.add('active');
  showAdminSection(target.id);
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}));

document.querySelector('.admin-nav')?.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || link.dataset.bound) return;
  const target = document.querySelector(link.getAttribute('href'));
  if (!target) return;
  event.preventDefault();
  showAdminSection(target.id);
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.addEventListener('click', (event) => { const trigger = event.target.closest('[data-admin-profile-open]'); if (!trigger) return; event.preventDefault(); showAdminSection('mi-perfil'); document.querySelector('#mi-perfil')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });

if (sessionStorage.getItem(adminSessionKey) === 'ok') showAdmin();
else if (loginScreen) { loginScreen.hidden = false; document.body.classList.add('admin-ready'); }
