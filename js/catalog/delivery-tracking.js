const referenceInput = document.querySelector('#deliveryReference');
const lookupButton = document.querySelector('#lookupDelivery');
const message = document.querySelector('#deliveryMessage');
const result = document.querySelector('#deliveryResult');
const progress = document.querySelector('#deliveryProgress');
const steps = [...document.querySelectorAll('[data-step]')];
const orderSteps = ['pending', 'En producción', 'Enviado', 'Entregado'];

function renderDelivery(order) {
  const currentIndex = Math.max(0, orderSteps.indexOf(order.status));
  steps.forEach((step, index) => step.classList.toggle('active', index <= currentIndex));
  progress.textContent = `${String(currentIndex + 1).padStart(2, '0')} — 04`;
  const design = Array.isArray(order.design) ? order.design[0] || {} : {};
  result.hidden = false;
  result.innerHTML = `<strong>#${order.reference}</strong><span>${order.customer_name || order.delivery?.name || 'Cliente'} · ${new Date(order.created_at).toLocaleDateString('es-CO')}</span><b>${design.text || 'Pieza personalizada'}</b><small>${order.delivery?.city || ''} · ${order.delivery?.phone || ''}</small>`;
}

lookupButton?.addEventListener('click', async () => {
  const reference = referenceInput.value.trim();
  if (!reference) { message.textContent = 'Escribe un número de pedido.'; return; }
  lookupButton.disabled = true; message.textContent = 'Buscando tu pedido…'; result.hidden = true;
  try { const response = await fetch(`/api/orders?reference=${encodeURIComponent(reference)}`); const raw = await response.text(); let order = {}; try { order = raw ? JSON.parse(raw) : {}; } catch { throw new Error(`La API devolvió una respuesta no válida (${response.status}).`); } if (!response.ok) throw new Error(order.error || 'No encontramos ese pedido.'); renderDelivery(order); message.textContent = 'Estado actualizado.'; } catch (error) { message.textContent = error.message; steps.forEach((step) => step.classList.remove('active')); progress.textContent = '01 — 04'; } finally { lookupButton.disabled = false; }
});
referenceInput?.addEventListener('keydown', (event) => { if (event.key === 'Enter') lookupButton.click(); });
