const cart = [];
const cartCount = document.querySelector('#cartCount');
const toast = document.querySelector('#toast');
const customBag = document.querySelector('#customBag');
const customText = document.querySelector('#customText');
const customSticker = document.querySelector('#customSticker');

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  window.setTimeout(() => toast.classList.remove('visible'), 2600);
}

function addToCart(name, price) {
  cart.push({ name, price });
  cartCount.textContent = cart.length;
  showToast(`${name} se añadió a tu carrito`);
}

document.querySelectorAll('.add-button').forEach((button) => {
  button.addEventListener('click', () => addToCart(button.dataset.product, Number(button.dataset.price)));
});

document.querySelectorAll('.swatch').forEach((swatch) => {
  swatch.addEventListener('click', () => {
    document.querySelector('.swatch.selected')?.classList.remove('selected');
    swatch.classList.add('selected');
    customBag.style.backgroundColor = swatch.dataset.color;
  });
});

document.querySelectorAll('.sticker-option').forEach((option) => {
  option.addEventListener('click', () => {
    document.querySelector('.sticker-option.active')?.classList.remove('active');
    option.classList.add('active');
    customSticker.textContent = option.dataset.sticker;
  });
});

document.querySelector('#textInput').addEventListener('input', (event) => {
  const value = event.target.value.trim();
  customText.innerHTML = value ? value.replace(/\s+/g, '<br />') : 'tu<br />idea aquí';
});

document.querySelector('#sizeSelect').addEventListener('change', (event) => {
  customBag.style.transform = event.target.value === 'large' ? 'scale(1.14)' : 'scale(1)';
});

document.querySelector('#imageInput').addEventListener('change', (event) => {
  if (event.target.files.length) showToast('Imagen de referencia adjuntada');
});

document.querySelector('#customAdd').addEventListener('click', () => addToCart('Mi tote personalizada', document.querySelector('#sizeSelect').value === 'large' ? 145000 : 120000));
document.querySelector('#cartButton').addEventListener('click', () => showToast(cart.length ? `${cart.length} pieza(s) en tu carrito · checkout próximamente` : 'Tu carrito está esperando una pieza especial'));
