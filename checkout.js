const cartKey = 'ivbags-cart';
let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
const money = (value) => `$${Number(value).toLocaleString('es-CO')}`;
const total = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
function renderCart() {
  document.querySelector('#cartCount').textContent = `${cart.length} ${cart.length === 1 ? 'pieza' : 'piezas'}`;
  document.querySelector('#summaryTotal').textContent = money(total());
  document.querySelector('#payTotal').textContent = money(total());
  document.querySelector('#cartItems').innerHTML = cart.length ? cart.map((item, index) => `<div class="cart-item"><div class="cart-item-preview">${item.image ? `<img src="${item.image}" alt="Diseño de ${item.name}"/>` : '✦'}</div><div class="cart-item-info"><strong>${item.name}</strong><small>${item.text || 'pieza pintada a mano'}<br/>cantidad: ${item.quantity}</small></div><div><span class="cart-item-price">${money(item.price * item.quantity)}</span><button class="remove-item" data-remove="${index}" aria-label="Quitar ${item.name}">×</button></div></div>`).join('') : '<p class="empty-cart">Tu carrito está esperando una pieza especial.</p>';
  document.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => { cart.splice(Number(button.dataset.remove), 1); localStorage.setItem(cartKey, JSON.stringify(cart)); renderCart(); }));
}
renderCart();
document.querySelectorAll('.payment-option').forEach((button) => button.addEventListener('click', () => { document.querySelector('.payment-option.active')?.classList.remove('active'); button.classList.add('active'); document.querySelector('#cardFields').hidden = button.dataset.payment !== 'card'; }));
document.querySelector('#payButton').addEventListener('click', () => {
  const customer = JSON.parse(localStorage.getItem('ivbags-customer') || 'null');
  if (!customer) { alert('Inicia sesión antes de realizar la compra.'); window.location.href = 'index.html'; return; }
  const required = ['customerName', 'customerEmail', 'customerAddress', 'customerCity', 'customerPhone'];
  const valid = required.every((id) => document.querySelector(`#${id}`).value.trim());
  if (!cart.length) { alert('Añade una pieza al carrito antes de pagar.'); return; }
  if (!valid) { document.querySelector(`#${required.find((id) => !document.querySelector(`#${id}`).value.trim())}`).focus(); return; }
  const number = `#IV-${Math.floor(1000 + Math.random() * 8999)}`;
  const orders = JSON.parse(localStorage.getItem('ivbags-orders') || '[]');
  orders.push({ number, customer, delivery: { name: document.querySelector('#customerName').value, email: document.querySelector('#customerEmail').value, address: document.querySelector('#customerAddress').value, city: document.querySelector('#customerCity').value, phone: document.querySelector('#customerPhone').value }, items: cart, total: total(), status: 'Pagado', createdAt: new Date().toISOString() });
  localStorage.setItem('ivbags-orders', JSON.stringify(orders));
  document.querySelector('#orderNumber').textContent = number;
  document.querySelector('#confirmation').hidden = false;
  localStorage.removeItem(cartKey);
  cart = [];
});
