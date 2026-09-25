const searchStyles = document.createElement('link'); searchStyles.rel = 'stylesheet'; searchStyles.href = 'css/admin/admin-search.css?v=20260925-search1'; document.head.append(searchStyles);

const searchState = { products: [], orders: [], customers: [], collaborators: [] };
const searchText = (value) => String(value || '').toLocaleLowerCase('es-CO');
const searchEscape = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const searchDetails = (item) => ({ title: item.title, detail: item.detail, section: item.section });

function buildSearchItems(query) {
  const normalized = searchText(query);
  if (!normalized) return [];
  const items = [];
  searchState.products.forEach((product) => { if ([product.name, product.category, product.status].some((value) => searchText(value).includes(normalized))) items.push(searchDetails({ title: product.name, detail: `Producto · ${product.category || 'Sin categoría'}`, section: 'productos' })); });
  searchState.orders.forEach((order) => { const delivery = order.delivery || {}; const customer = order.customer_name || delivery.name || ''; if ([order.reference, customer, order.status, order.payment_status, delivery.city].some((value) => searchText(value).includes(normalized))) items.push(searchDetails({ title: `#${order.reference}`, detail: `Pedido · ${customer || 'Cliente'}`, section: 'ventas' })); });
  searchState.customers.forEach((customer) => { if ([customer.name, customer.email, customer.phone].some((value) => searchText(value).includes(normalized))) items.push(searchDetails({ title: customer.name, detail: `Cliente · ${customer.email}`, section: 'clientes' })); });
  searchState.collaborators.forEach((user) => { if ([user.name, user.username].some((value) => searchText(value).includes(normalized))) items.push(searchDetails({ title: user.name, detail: `Colaborador · ${user.username}`, section: 'colaboradores' })); });
  const categories = [...new Set(searchState.products.map((product) => product.category).filter(Boolean))]; categories.forEach((category) => { if (searchText(category).includes(normalized)) items.push(searchDetails({ title: category, detail: 'Categoría de productos', section: 'categorias' })); });
  return items.slice(0, 12);
}

function mountSearch() {
  if (document.querySelector('.admin-global-search')) return;
  const shell = document.createElement('div'); shell.className = 'admin-global-search'; shell.innerHTML = '<label class="search-label" for="adminGlobalSearch">Buscar en el panel</label><span class="search-symbol" aria-hidden="true">⌕</span><input id="adminGlobalSearch" type="search" placeholder="Buscar pedidos, clientes o productos" autocomplete="off"/><button class="search-clear" type="button" aria-label="Limpiar búsqueda">×</button><div class="search-results" role="listbox" aria-label="Resultados de búsqueda"></div>';
  document.querySelector('.admin-topbar')?.insertBefore(shell, document.querySelector('.admin-topbar-meta'));
  const input = shell.querySelector('input'); const results = shell.querySelector('.search-results'); const clear = shell.querySelector('.search-clear');
  const render = () => { const matches = buildSearchItems(input.value); results.innerHTML = matches.length ? matches.map((item) => `<button type="button" role="option" data-section="${searchEscape(item.section)}"><strong>${searchEscape(item.title)}</strong><span>${searchEscape(item.detail)}</span></button>`).join('') : input.value.trim() ? '<p class="search-empty">No encontramos coincidencias.</p>' : ''; shell.classList.toggle('has-results', matches.length > 0 || Boolean(input.value.trim())); };
  input.addEventListener('input', render); clear.addEventListener('click', () => { input.value = ''; render(); input.focus(); }); results.addEventListener('click', (event) => { const target = event.target.closest('[data-section]'); if (!target) return; window.showAdminSection(target.dataset.section); input.value = ''; render(); input.blur(); }); document.addEventListener('click', (event) => { if (!shell.contains(event.target)) shell.classList.remove('has-results'); });
}

document.addEventListener('ivbags-admin-data-ready', (event) => { searchState.products = event.detail.products || []; searchState.orders = event.detail.orders || []; mountSearch(); });
mountSearch();
fetch('/api/admin/customers', { headers: { 'Content-Type': 'application/json', 'X-Admin-Password': '12345678' } }).then((response) => response.ok ? response.json() : []).then((customers) => { searchState.customers = Array.isArray(customers) ? customers : []; }).catch(() => {});
try { searchState.collaborators = JSON.parse(localStorage.getItem('ivbags-admin-users') || '[]'); } catch { searchState.collaborators = []; }
