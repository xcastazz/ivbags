const modalButtons = document.querySelectorAll('[data-open-panel]');
const closeButtons = document.querySelectorAll('[data-close-panel]');

function openModal(id) {
  const modal = document.querySelector(`#${id}`);
  modal?.classList.add('open');
  modal?.setAttribute('aria-hidden', 'false');
}
function closeModal(button) {
  const modal = button.closest('.admin-modal');
  modal?.classList.remove('open');
  modal?.setAttribute('aria-hidden', 'true');
}
modalButtons.forEach((button) => button.addEventListener('click', () => openModal(button.dataset.openPanel)));
closeButtons.forEach((button) => button.addEventListener('click', () => closeModal(button)));
document.querySelectorAll('.admin-modal').forEach((modal) => modal.addEventListener('click', (event) => {
  if (event.target === modal) closeModal(modal.querySelector('[data-close-panel]'));
}));

document.querySelector('#productForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const name = data.get('name');
  const price = data.get('price');
  const availability = data.get('availability');
  const card = document.createElement('article');
  card.className = 'admin-product';
  card.innerHTML = `<div class="admin-product-art art-yellow">✦</div><div class="admin-product-info"><strong>${name}</strong><span>${data.get('category')} · ${price}</span><b>${availability}</b></div>`;
  document.querySelector('.add-product-card').before(card);
  event.currentTarget.reset();
  closeModal(event.currentTarget.closest('.admin-modal').querySelector('[data-close-panel]'));
});

document.querySelectorAll('[data-category-color]').forEach((button) => button.addEventListener('click', () => {
  document.querySelector('[data-category-color].selected')?.classList.remove('selected');
  button.classList.add('selected');
}));
document.querySelector('#categoryForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = new FormData(event.currentTarget).get('name');
  const row = document.createElement('div');
  row.innerHTML = `<span class="category-swatch swatch-green"></span><strong>${name}</strong><small>0 productos</small><button>···</button>`;
  document.querySelector('.category-list').append(row);
  event.currentTarget.reset();
  closeModal(event.currentTarget.closest('.admin-modal').querySelector('[data-close-panel]'));
});
