const stage = document.querySelector('#designArea');
const toteImage = document.querySelector('.tote-artboard');
const textObject = document.querySelector('#textObject');
const imageObject = document.querySelector('#imageObject');
let activeObject = textObject;

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
makeDraggable(textObject); makeResizable(textObject); makeDraggable(imageObject); makeResizable(imageObject);

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
  textObject.style.fontFamily = button.dataset.font === 'serif' ? 'var(--serif)' : button.dataset.font === 'mono' ? 'Courier Prime, monospace' : 'var(--hand)';
}));

document.querySelector('#designImageInput').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener('load', () => { document.querySelector('#uploadedImage').src = reader.result; imageObject.hidden = false; selectObject(imageObject); });
  reader.readAsDataURL(file);
});
document.querySelector('#removeImage').addEventListener('click', () => { imageObject.hidden = true; document.querySelector('#designImageInput').value = ''; selectObject(textObject); });
document.querySelector('#saveDesign').addEventListener('click', () => { document.querySelector('#saveMessage').textContent = 'Tu diseño quedó guardado. Nos pondremos en contacto contigo ✓'; });
