const miniToteStyles = document.createElement('link'); miniToteStyles.rel = 'stylesheet'; miniToteStyles.href = 'css/home/mini-totes.css?v=20260925-cachefix1'; document.head.append(miniToteStyles);
const aboutModal = document.querySelector('#aboutModal');
const envelopeTrigger = document.querySelector('.envelope-trigger');
const closeAbout = document.querySelector('.about-close');
const gallery = document.querySelector('#galleryGrid');
const galleryMotionToggle = document.querySelector('#galleryMotionToggle');
const gallerySpinButton = document.querySelector('#gallerySpinButton');
const galleryPhotos = [
  ['assets/tote1.png', 'piezas que cuentan historias', 'Camiseta y piezas textiles pintadas a mano'],
  ['assets/tote2.png', 'amigos para llevar', 'Bolso personalizado con perros y flores'],
  ['assets/tote3.png', 'días de color', 'Bolso personalizado con personajes'],
  ['assets/tote4.png', 'ballenas y calma', 'Bolso personalizado con ballenas azules'],
  ['assets/tote5.png', 'el taller por dentro', 'Bolso personalizado en el taller de iv bags'],
  ['assets/tote6.png', 'flores para llevar', 'Persona llevando un bolso bordado'],
  ['assets/tote 7.png', 'una pieza con memoria', 'Bolso negro bordado con flores'],
  ['assets/tote8.png', 'dibujos para llevar', 'Bolso personalizado con gatos'],
];
let galleryIndex = 0;
let gallerySpinning = false;
let lightbox;
function setAbout(open) {
  aboutModal?.classList.toggle('open', open);
  aboutModal?.setAttribute('aria-hidden', String(!open));
  document.querySelector('.home-board')?.classList.toggle('letter-open', open);
}
envelopeTrigger?.addEventListener('click', () => setAbout(true));
closeAbout?.addEventListener('click', () => setAbout(false));
aboutModal?.addEventListener('click', (event) => { if (event.target === aboutModal) setAbout(false); });
function createGalleryLightbox() {
  if (lightbox) return lightbox;
  lightbox = document.createElement('div');
  lightbox.className = 'gallery-lightbox';
  lightbox.setAttribute('aria-hidden', 'true');
  lightbox.innerHTML = '<figure class="gallery-lightbox-card"><button class="gallery-lightbox-close" type="button" aria-label="Cerrar imagen">×</button><img alt="" /><figcaption></figcaption></figure>';
  document.body.append(lightbox);
  lightbox.addEventListener('click', (event) => { if (event.target === lightbox || event.target.closest('.gallery-lightbox-close')) closeGalleryLightbox(); });
  return lightbox;
}
function openGalleryLightbox(button) {
  const modal = createGalleryLightbox();
  modal.querySelector('img').src = button.dataset.galleryImage;
  modal.querySelector('img').alt = button.querySelector('img')?.alt || '';
  modal.querySelector('figcaption').textContent = button.dataset.galleryCaption || '';
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('gallery-is-open');
}
function closeGalleryLightbox() { if (!lightbox) return; lightbox.classList.remove('open'); lightbox.setAttribute('aria-hidden', 'true'); document.body.classList.remove('gallery-is-open'); }
function bindGalleryPhotos() { gallery?.querySelectorAll('.gallery-photo').forEach((button) => button.onclick = () => openGalleryLightbox(button)); }
function renderGalleryPhotos() {
  gallery?.querySelectorAll('.gallery-photo').forEach((button, index) => {
    const [image, caption, alt] = galleryPhotos[(galleryIndex + index) % galleryPhotos.length];
    button.dataset.galleryImage = image;
    button.dataset.galleryCaption = caption;
    button.querySelector('img').src = image;
    button.querySelector('img').alt = alt;
  });
  bindGalleryPhotos();
}
function createIncomingPhotos(nextIndex) {
  const incoming = [];
  gallery?.querySelectorAll('.gallery-photo:not(.gallery-incoming)').forEach((button, index) => {
    const clone = button.cloneNode(true);
    const [image, caption, alt] = galleryPhotos[(nextIndex + index) % galleryPhotos.length];
    clone.classList.add('gallery-incoming');
    clone.dataset.slot = String(index + 1);
    clone.dataset.galleryImage = image;
    clone.dataset.galleryCaption = caption;
    clone.querySelector('img').src = image;
    clone.querySelector('img').alt = alt;
    gallery.append(clone);
    incoming.push(clone);
  });
  incoming.forEach((button) => button.addEventListener('click', () => openGalleryLightbox(button)));
}
function spinGallery() {
  if (!gallery || gallerySpinning) return;
  gallerySpinning = true;
  gallerySpinButton.disabled = true;
  const nextIndex = (galleryIndex + 4) % galleryPhotos.length;
  createIncomingPhotos(nextIndex);
  gallery.classList.add('gallery-spinning');
  window.setTimeout(() => {
    gallery.querySelectorAll('.gallery-photo:not(.gallery-incoming)').forEach((button) => button.remove());
    gallery.querySelectorAll('.gallery-incoming').forEach((button) => button.classList.remove('gallery-incoming'));
    galleryIndex = nextIndex;
    gallery.classList.remove('gallery-spinning');
    gallerySpinButton.disabled = false;
    gallerySpinning = false;
  }, 3400);
}
bindGalleryPhotos();
gallery?.classList.add('gallery-moving');
galleryMotionToggle?.addEventListener('click', () => { const moving = gallery?.classList.toggle('gallery-moving'); galleryMotionToggle.setAttribute('aria-pressed', String(Boolean(moving))); galleryMotionToggle.textContent = moving ? 'pausar movimiento' : 'activar movimiento'; });
gallerySpinButton?.addEventListener('click', spinGallery);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setAbout(false); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeGalleryLightbox(); });
