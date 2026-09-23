const aboutModal = document.querySelector('#aboutModal');
const envelopeTrigger = document.querySelector('.envelope-trigger');
const closeAbout = document.querySelector('.about-close');
function setAbout(open) {
  aboutModal?.classList.toggle('open', open);
  aboutModal?.setAttribute('aria-hidden', String(!open));
}
envelopeTrigger?.addEventListener('click', () => setAbout(true));
closeAbout?.addEventListener('click', () => setAbout(false));
aboutModal?.addEventListener('click', (event) => { if (event.target === aboutModal) setAbout(false); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setAbout(false); });
