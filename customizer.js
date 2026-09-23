const optionStyles = document.createElement('link'); optionStyles.rel = 'stylesheet'; optionStyles.href = 'customizer-options.css'; document.head.append(optionStyles);
const stage = document.querySelector('#designArea');
const toteImage = document.querySelector('.tote-artboard');
const textObject = document.querySelector('#textObject');
const imageObject = document.querySelector('#imageObject');
const iconObject = document.querySelector('#iconObject');
let activeObject = textObject;
const palette = [{ name: 'Blanca', color: '#fff' }, { name: 'Negra', color: '#161817' }, { name: 'Gris', color: '#929292' }, { name: 'Beige', color: '#e4d2b6' }, { name: 'Oliva', color: '#7a8551' }];
const colorOptions = document.querySelector('.color-options');
palette.forEach((item, index) => {
  const option = colorOptions.children[index] || document.createElement('button');
  option.className = 'color-option' + (index === 0 ? ' selected' : '');
  option.dataset.toteColor = item.color;
  option.setAttribute('aria-label', item.name);
  if (index === 4 && !option.parentElement) colorOptions.append(option);
});

function selectObject(object) {
  document.querySelectorAll('.design-object').forEach((item) => item.classList.remove('selected'));
  activeObject = object;
  object.classList.add('selected');
}
function moveObject(object, clientX, clientY) {
  const rect = stage.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width - object.offsetWidth, clientX - rect.left - object.offsetWidth / 2));
  const y = Math.max(0, Math.min(rect.height - object.offsetHeight, clientY - rect.top - object.offsetHeight / 2));
  object.style.left = `${(x / rect.width) * 100}%`;
  object.style.top = `${(y / rect.height) * 100}%`;
}
function makeDraggable(object) {
  let dragging = false;
  object.addEventListener('pointerdown', (event) => {
    if (event.target.classList.contains('resize-handle')) return;
    dragging = true;
    selectObject(object);
    object.setPointerCapture(event.pointerId);
  });
  object.addEventListener('pointermove', (event) => {
    if (dragging) moveObject(object, event.clientX, event.clientY);
  });
  object.addEventListener('pointerup', () => { dragging = false; });
}
function makeResizable(object) {
  const handle = object.querySelector('.resize-handle');
  let resizing = false;
  let startSize = 0;
  let startX = 0;
  handle.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
    resizing = true;
    startSize = object.offsetWidth;
    startX = event.clientX;
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove', (event) => {
    if (!resizing) return;
    const size = Math.max(42, Math.min(260, startSize + event.clientX - startX));
    if (object === textObject) object.style.fontSize = `${Math.round(size / 4)}px`;
    else { object.style.width = `${size}px`; object.style.height = `${size}px`; }
  });
  handle.addEventListener('pointerup', () => { resizing = false; });
}
makeDraggable(textObject); makeResizable(textObject); makeDraggable(imageObject); makeResizable(imageObject); makeDraggable(iconObject); makeResizable(iconObject);

document.querySelectorAll('[data-tote-color]').forEach((button) => button.addEventListener('click', () => {
  document.querySelector('.color-option.selected')?.classList.remove('selected');
  button.classList.add('selected');
  document.querySelector('.tote-stage').style.setProperty('--tote-tint', button.dataset.toteColor);
}));

document.querySelector('#designTextInput').addEventListener('input', (event) => {
  textObject.querySelector('span').textContent = event.target.value || 'tu idea aquí';
  selectObject(textObject);
});
document.querySelectorAll('[data-font]').forEach((button) => button.addEventListener('click', () => {
  document.querySelector('.font-button.active')?.classList.remove('active');
  button.classList.add('active');
  textObject.dataset.font = button.dataset.font;
  textObject.style.fontFamily = button.dataset.font === 'serif' ? 'var(--serif)' : button.dataset.font === 'mono' ? 'Courier Prime, monospace' : button.dataset.font === 'round' ? 'var(--sans)' : button.dataset.font === 'typewriter' ? 'monospace' : 'var(--hand)';
}));
const textColorTools = document.querySelector('.type-color-tools');
if (textColorTools && !textColorTools.querySelector('[data-text-color="#fff"]')) { const whiteColor = document.createElement('button'); whiteColor.className = 'type-color'; whiteColor.dataset.textColor = '#fff'; whiteColor.setAttribute('aria-label', 'Blanco'); textColorTools.append(whiteColor); }
document.querySelectorAll('[data-text-color]').forEach((button) => button.addEventListener('click', () => { document.querySelector('.type-color.selected')?.classList.remove('selected'); button.classList.add('selected'); textObject.style.color = button.dataset.textColor; if (iconObject) iconObject.style.color = button.dataset.textColor; }));
document.querySelectorAll('[data-icon]').forEach((button) => button.addEventListener('click', () => { iconObject.hidden = false; iconObject.querySelector('#customIcon').textContent = button.dataset.icon; selectObject(iconObject); document.querySelector('.icon-option.active')?.classList.remove('active'); button.classList.add('active'); }));

document.querySelector('#designImageInput').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener('load', () => { document.querySelector('#uploadedImage').src = reader.result; imageObject.hidden = false; selectObject(imageObject); });
  reader.readAsDataURL(file);
});
document.querySelector('#removeImage').addEventListener('click', () => { imageObject.hidden = true; document.querySelector('#designImageInput').value = ''; selectObject(textObject); });
document.querySelector('#saveDesign').addEventListener('click', () => {
  if (!getCustomer()) { openCustomerAuth(); document.querySelector('#saveMessage').textContent = 'Inicia sesión para guardar tu diseño y comprarlo.'; return; }
  const selectedColor = document.querySelector('.color-option.selected')?.dataset.toteColor || '#f2eadb';
  const cart = JSON.parse(localStorage.getItem('ivbags-cart') || '[]');
  cart.push({ id: `custom-${Date.now()}`, name: 'Tote personalizada', price: 145000, color: selectedColor, text: textObject.querySelector('span').textContent, textColor: getComputedStyle(textObject).color, font: textObject.style.fontFamily || 'manuscrita', icon: iconObject.hidden ? '' : iconObject.querySelector('#customIcon').textContent, image: document.querySelector('#uploadedImage').src || '', quantity: 1 });
  localStorage.setItem('ivbags-cart', JSON.stringify(cart));
  document.querySelector('#saveMessage').innerHTML = 'Tu diseño está en el carrito ✓ <a href="checkout.html">Continuar al pago →</a>';
});
