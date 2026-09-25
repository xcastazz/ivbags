const optionStyles = document.createElement('link'); optionStyles.rel = 'stylesheet'; optionStyles.href = 'css/customizer/customizer-options.css?v=20260925-cachefix1'; document.head.append(optionStyles);
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
    startSize = object === textObject || object === iconObject ? parseFloat(getComputedStyle(object).fontSize) : object.offsetWidth;
    startX = event.clientX;
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove', (event) => {
    if (!resizing) return;
    const size = Math.max(object === iconObject ? 20 : 42, Math.min(object === iconObject ? 160 : 260, startSize + event.clientX - startX));
    if (object === textObject) object.style.fontSize = `${Math.round(size / 4)}px`;
    else if (object === iconObject) object.style.fontSize = `${Math.round(size)}px`;
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
function loadPreviewImage(source) { return new Promise((resolve) => { if (!source) return resolve(null); const image = new Image(); image.onload = () => resolve(image); image.onerror = () => resolve(null); image.src = source; }); }
async function createDesignPreview() { const stageRect = document.querySelector('.tote-stage').getBoundingClientRect(); const scale = 1000 / stageRect.width; const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = Math.max(700, Math.round(stageRect.height * scale)); const context = canvas.getContext('2d'); context.fillStyle = getComputedStyle(document.querySelector('.tote-stage')).backgroundColor || '#d9d5bd'; context.fillRect(0, 0, canvas.width, canvas.height); const base = await loadPreviewImage(toteImage.currentSrc || toteImage.src); if (base) { const ratio = Math.min(canvas.width / base.naturalWidth, canvas.height / base.naturalHeight); const width = base.naturalWidth * ratio; const height = base.naturalHeight * ratio; context.drawImage(base, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height); } const color = document.querySelector('.color-option.selected')?.dataset.toteColor || '#fff'; context.save(); context.globalAlpha = .78; context.globalCompositeOperation = 'multiply'; context.fillStyle = color; context.beginPath(); context.moveTo(canvas.width * .30, canvas.height * .38); context.lineTo(canvas.width * .70, canvas.height * .38); context.lineTo(canvas.width * .70, canvas.height * .78); context.lineTo(canvas.width * .67, canvas.height * .80); context.lineTo(canvas.width * .33, canvas.height * .80); context.lineTo(canvas.width * .30, canvas.height * .78); context.closePath(); context.fill(); context.restore(); const drawLayer = async (object, kind) => { if (object.hidden) return; const objectRect = object.getBoundingClientRect(); const x = (objectRect.left - stageRect.left) * scale; const y = (objectRect.top - stageRect.top) * scale; const width = objectRect.width * scale; const height = objectRect.height * scale; if (kind === 'image') { const image = await loadPreviewImage(object.querySelector('img')?.src); if (image) context.drawImage(image, x, y, width, height); return; } const computed = getComputedStyle(object); context.save(); context.translate(x + width / 2, y + height / 2); context.rotate((kind === 'text' ? -5 : 8) * Math.PI / 180); context.fillStyle = computed.color; context.font = `${computed.fontStyle} ${computed.fontWeight} ${computed.fontSize.replace('px', '') * scale}px ${computed.fontFamily}`; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(object.querySelector('span')?.textContent || '', 0, 0, width); context.restore(); }; await drawLayer(imageObject, 'image'); await drawLayer(textObject, 'text'); await drawLayer(iconObject, 'icon'); return canvas.toDataURL('image/png'); }
document.querySelector('#saveDesign').addEventListener('click', async () => {
  if (!getCustomer()) { openCustomerAuth(); document.querySelector('#saveMessage').textContent = 'Inicia sesión para guardar tu diseño y comprarlo.'; return; }
  const selectedColor = document.querySelector('.color-option.selected')?.dataset.toteColor || '#f2eadb';
  const cart = JSON.parse(localStorage.getItem('ivbags-cart') || '[]');
  const preview = await createDesignPreview();
  cart.push({ id: `custom-${Date.now()}`, name: 'Tote personalizada', price: 145000, color: selectedColor, preview, text: textObject.querySelector('span').textContent, textColor: getComputedStyle(textObject).color, font: textObject.style.fontFamily || 'var(--hand)', textSize: textObject.style.fontSize || '', textPosition: { left: textObject.style.left || '34%', top: textObject.style.top || '38%' }, icon: iconObject.hidden ? '' : iconObject.querySelector('#customIcon').textContent, iconColor: getComputedStyle(iconObject).color, iconSize: iconObject.style.fontSize || '', iconPosition: { left: iconObject.style.left || '58%', top: iconObject.style.top || '22%' }, image: document.querySelector('#uploadedImage').src || '', imageSize: imageObject.style.width || '', imagePosition: { left: imageObject.style.left || '33%', top: imageObject.style.top || '25%' }, quantity: 1 });
  localStorage.setItem('ivbags-cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('ivbags-cart-updated'));
  document.querySelector('#saveMessage').innerHTML = 'Tu diseño está en el carrito ✓ <a href="checkout.html">Continuar al pago →</a>';
});
