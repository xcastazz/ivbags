const steps = [...document.querySelectorAll('.step')];
const progress = [...document.querySelectorAll('.progress span')];
const previewBag = document.querySelector('#previewBag');
const previewText = document.querySelector('#previewText');
const previewDecor = document.querySelector('#previewDecor');
const previewStep = document.querySelector('#previewStep');
let currentStep = 1;

function renderStep() {
  steps.forEach((step) => step.classList.toggle('active', Number(step.dataset.step) === currentStep));
  progress.forEach((item, index) => item.classList.toggle('active', index < currentStep));
  if (previewStep) previewStep.textContent = `0${currentStep} / 04`;
}

document.querySelectorAll('[data-color]').forEach((option) => {
  option.addEventListener('click', () => {
    document.querySelector('[data-color].selected')?.classList.remove('selected');
    option.classList.add('selected');
    if (previewBag) previewBag.style.backgroundColor = option.dataset.color;
  });
});

document.querySelectorAll('[data-decor]').forEach((option) => {
  option.addEventListener('click', () => {
    document.querySelector('[data-decor].selected')?.classList.remove('selected');
    option.classList.add('selected');
    if (previewDecor) previewDecor.textContent = option.dataset.decor;
  });
});

document.querySelector('#customPhrase')?.addEventListener('input', (event) => {
  const text = event.target.value.trim();
  if (previewText) previewText.innerHTML = text ? text.replace(/\s+/g, '<br />') : 'tu<br />idea aquí';
});

document.querySelectorAll('.next-step').forEach((button) => button.addEventListener('click', () => {
  currentStep = Math.min(currentStep + 1, 4);
  renderStep();
}));
document.querySelectorAll('.previous-step').forEach((button) => button.addEventListener('click', () => {
  currentStep = Math.max(currentStep - 1, 1);
  renderStep();
}));

document.querySelector('#referenceImage')?.addEventListener('change', (event) => {
  if (event.target.files.length) document.querySelector('#referenceStatus')?.classList.add('show');
});
document.querySelector('#finishDesign')?.addEventListener('click', (event) => {
  event.currentTarget.textContent = 'Diseño guardado ✓';
  event.currentTarget.disabled = true;
});
