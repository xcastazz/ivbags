const checkoutStyles = document.createElement('link'); checkoutStyles.rel = 'stylesheet'; checkoutStyles.href = 'checkout-note.css'; document.head.append(checkoutStyles);
const cartKey = 'ivbags-cart';
const apiBase = window.IVBAGS_API_URL || (location.hostname === 'localhost' || location.protocol === 'file:' ? 'http://localhost:8787/api' : 'https://ivbags-api.onrender.com/api');
function loadWompiWidget() { return new Promise((resolve, reject) => { if (window.WidgetCheckout) return resolve(); const script = document.createElement('script'); script.src = 'https://checkout.wompi.co/widget.js'; script.onload = resolve; script.onerror = () => reject(new Error('No se pudo cargar el widget de Wompi.')); document.head.append(script); }); }
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
  const payButton = document.querySelector('#payButton');
  payButton.disabled = true;
  fetch(`${apiBase}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer.token}` }, body: JSON.stringify({ items: cart, delivery: { name: document.querySelector('#customerName').value, email: document.querySelector('#customerEmail').value, address: document.querySelector('#customerAddress').value, city: document.querySelector('#customerCity').value, phone: document.querySelector('#customerPhone').value }, design: cart.map((item) => ({ text: item.text, image: item.image, icon: item.icon, color: item.color })) }) }).then((response) => response.json()).then((order) => fetch(`${apiBase}/wompi/signature`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer.token}` }, body: JSON.stringify({ reference: order.reference, amount: order.total }) })).then((response) => response.json()).then(async (payment) => { await loadWompiWidget(); if (!payment.publicKey || !payment.signature) throw new Error('Wompi no está configurado todavía en el backend.'); const widget = new WidgetCheckout({ currency: payment.currency, amountInCents: payment.amountInCents, reference: payment.reference, publicKey: payment.publicKey, signature: { integrity: payment.signature }, redirectUrl: `${location.origin}/checkout.html` }); widget.open((result) => { if (result?.transaction?.status === 'APPROVED') completeOrder(result.transaction.id); }); }).catch((error) => { alert(error.message || 'No se pudo iniciar el pago.'); payButton.disabled = false; });
  return;
  function completeOrder(transactionId) {
  const orders = JSON.parse(localStorage.getItem('ivbags-orders') || '[]');
  orders.push({ number, customer, delivery: { name: document.querySelector('#customerName').value, email: document.querySelector('#customerEmail').value, address: document.querySelector('#customerAddress').value, city: document.querySelector('#customerCity').value, phone: document.querySelector('#customerPhone').value }, items: cart, total: total(), status: 'Pagado', createdAt: new Date().toISOString() });
  localStorage.setItem('ivbags-orders', JSON.stringify(orders));
  document.querySelector('#orderNumber').textContent = number;
  document.querySelector('#confirmation').hidden = false;
  localStorage.removeItem(cartKey);
  cart = [];
  }
});
