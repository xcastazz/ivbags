const storageKey = 'ivbags-admin-session';
const stateKey = 'ivbags-admin-state';
const loginScreen = document.querySelector('#loginScreen');
const adminApp = document.querySelector('#adminApp');
const defaultState = { statuses: { 'IV-2048': 'Pagado', 'IV-2047': 'En producción', 'IV-2046': 'Enviado', 'IV-2045': 'Pagado' } };
const state = JSON.parse(localStorage.getItem(stateKey) || JSON.stringify(defaultState));

function showApp() { loginScreen.hidden = true; adminApp.hidden = false; }
if (sessionStorage.getItem(storageKey) === 'ok') showApp();

document.querySelector('#loginForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const user = document.querySelector('#loginUser').value.trim();
  const password = document.querySelector('#loginPassword').value;
  if (user === 'admin' && password === 'ivtotebags') { sessionStorage.setItem(storageKey, 'ok'); showApp(); }
  else document.querySelector('#loginError').classList.add('visible');
});
document.querySelector('#logoutButton')?.addEventListener('click', () => { sessionStorage.removeItem(storageKey); window.location.reload(); });

function saveState() { localStorage.setItem(stateKey, JSON.stringify(state)); }
function updateStatus(order, status) {
  state.statuses[order] = status;
  saveState();
  const select = document.querySelector(`[data-order-status="${order}"]`);
  if (select) { select.value = status; select.dataset.value = status; }
}
document.querySelectorAll('[data-order-status]').forEach((select) => { const order = select.dataset.orderStatus; select.value = state.statuses[order] || select.value; select.dataset.value = select.value; select.addEventListener('change', () => updateStatus(order, select.value)); });

document.querySelectorAll('[data-order-detail]').forEach((button) => button.addEventListener('click', () => {
  const row = button.closest('.sale-row');
  const order = button.dataset.orderDetail;
  document.querySelector('#detailTitle').textContent = `#${order}`;
  document.querySelector('#detailClient').textContent = row.children[1].textContent;
  document.querySelector('#detailProduct').textContent = row.children[2].textContent;
  document.querySelector('#detailStatus').value = state.statuses[order] || 'Pagado';
  document.querySelector('#detailPreviewText').textContent = order === 'IV-2047' ? 'días bonitos' : row.children[2].textContent;
  openModal('orderPanel');
}));
document.querySelector('#saveOrderStatus')?.addEventListener('click', () => { const order = document.querySelector('#detailTitle').textContent.replace('#',''); updateStatus(order, document.querySelector('#detailStatus').value); closeModal(document.querySelector('#orderPanel [data-close-panel]')); });

function openModal(id) { const modal = document.querySelector(`#${id}`); modal?.classList.add('open'); modal?.setAttribute('aria-hidden', 'false'); }
function closeModal(button) { const modal = button.closest('.admin-modal'); modal?.classList.remove('open'); modal?.setAttribute('aria-hidden', 'true'); }
document.querySelectorAll('[data-open-panel]').forEach((button) => button.addEventListener('click', () => openModal(button.dataset.openPanel)));
document.querySelectorAll('[data-close-panel]').forEach((button) => button.addEventListener('click', () => closeModal(button)));
document.querySelectorAll('.admin-modal').forEach((modal) => modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(modal.querySelector('[data-close-panel]')); }));

document.querySelector('#productForm')?.addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const card = document.createElement('article'); card.className = 'admin-product'; card.innerHTML = `<div class="admin-product-art art-yellow">✦</div><div class="admin-product-info"><strong>${data.get('name')}</strong><span>${data.get('category')} · ${data.get('price')}</span><b>${data.get('availability')}</b></div>`; document.querySelector('.add-product-card').before(card); event.currentTarget.reset(); closeModal(event.currentTarget.closest('.admin-modal').querySelector('[data-close-panel]')); });
document.querySelectorAll('[data-category-color]').forEach((button) => button.addEventListener('click', () => { document.querySelector('[data-category-color].selected')?.classList.remove('selected'); button.classList.add('selected'); }));
document.querySelector('#categoryForm')?.addEventListener('submit', (event) => { event.preventDefault(); const name = new FormData(event.currentTarget).get('name'); const row = document.createElement('div'); row.innerHTML = `<span class="category-swatch swatch-green"></span><strong>${name}</strong><small>0 productos</small>`; document.querySelector('.category-list').append(row); event.currentTarget.reset(); closeModal(event.currentTarget.closest('.admin-modal').querySelector('[data-close-panel]')); });

document.querySelectorAll('[data-production-card], .production-column article').forEach((card) => card.addEventListener('dragstart', (event) => { event.dataTransfer.setData('text/plain', card.outerHTML); card.classList.add('dragging'); }));
document.querySelectorAll('.production-column').forEach((column) => { column.addEventListener('dragover', (event) => { event.preventDefault(); column.classList.add('drag-over'); }); column.addEventListener('dragleave', () => column.classList.remove('drag-over')); column.addEventListener('drop', (event) => { event.preventDefault(); column.classList.remove('drag-over'); const card = document.querySelector('.dragging'); if (card) { column.append(card); card.classList.remove('dragging'); const small = card.querySelector('small'); if (small) small.textContent = column.dataset.production === 'Listo' ? 'listo para empacar' : column.dataset.production === 'En proceso' ? 'en producción' : 'pendiente de iniciar'; } }); });
