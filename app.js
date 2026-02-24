// app.js
// REEMPLAZA la URL por tu webhook real (Zapier / Make / backend)
const WEBHOOK_URL = 'https://hooks.example.com/your-webhook-url';

// Basic UI refs
const welcome = document.getElementById('welcome');
const btnEnter = document.getElementById('btnEnter');
const app = document.getElementById('app');

const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const closeLogin = document.getElementById('closeLogin');

const contactModal = document.getElementById('contactModal');
const contactForm = document.getElementById('contactForm');
const closeContact = document.getElementById('closeContact');

const tabs = document.querySelectorAll('.tab');
const tabPanels = document.querySelectorAll('.tab-panel');
const ctaButtons = document.querySelectorAll('[data-action]');

// Mostrar el app y abrir modal de login cuando presionan "Iniciar sesión"
btnEnter.addEventListener('click', () => {
  // ocultar bienvenida y mostrar app
  welcome.style.display = 'none';
  app.hidden = false;
  // abrir modal de login
  openModal(loginModal);
  document.getElementById('userEmail').focus();
});

// Funciones para modales
function openModal(modal) {
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
}
function closeModal(modal) {
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
}

// Login modal controls
closeLogin.addEventListener('click', () => closeModal(loginModal));
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  // Prototipo: no autenticación real. Cerrar modal.
  alert('Logged in (prototipo). Ahora puedes usar la landing.');
  closeModal(loginModal);
  loginForm.reset();
});

// Tab switching
tabs.forEach(tab => {
  tab.addEventListener('click', (e) => {
    const target = e.currentTarget.dataset.tab;
    // toggle active class
    tabs.forEach(t => t.classList.remove('active'));
    e.currentTarget.classList.add('active');
    // show/hide panels
    tabPanels.forEach(p => {
      if (p.id === target) p.hidden = false;
      else p.hidden = true;
    });
  });
});

// CTA buttons open contact modal and set intent
ctaButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    const intent = e.currentTarget.dataset.action || 'contacto';
    document.getElementById('formIntent').value = intent;
    openModal(contactModal);
    document.getElementById('company').focus();
  });
});

closeContact.addEventListener('click', () => closeModal(contactModal));
contactModal.addEventListener('click', (e) => { if (e.target === contactModal) closeModal(contactModal); });

// Webhook submit function
async function postToWebhook(payload) {
  if (!WEBHOOK_URL || WEBHOOK_URL.includes('example.com')) {
    console.warn('Webhook no configurado. Sustituye WEBHOOK_URL en app.js por la URL real.');
    return { ok: false, message: 'Webhook no configurado (placeholder).' };
  }
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, status: res.status, text };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// Contact form submit
contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const company = contactForm.company.value.trim();
  const name = contactForm.name.value.trim();
  const email = contactForm.email.value.trim();
  if (!company || !name || !email) {
    alert('Completa Empresa, Nombre y Email.');
    return;
  }

  const payload = {
    intent: contactForm.intent.value || contactForm.dataset.intent || 'contacto',
    company,
    name,
    email,
    notes: contactForm.notes.value || '',
    ts: new Date().toISOString(),
    source: 'Landing MVP - Retención Gen Z'
  };

  // Intent: enviar al webhook
  const result = await postToWebhook(payload);

  // cerrar modal y notificar usuario (si falla, igualmente el envío local se puede manejar en backend)
  closeModal(contactModal);
  if (result.ok) {
    alert('Gracias — solicitud enviada. Nos contactaremos pronto.');
  } else {
    alert('Solicitud registrada localmente. No se pudo enviar al webhook: ' + (result.message || result.error || result.text || 'Error desconocido') + '\n\nRevisa la configuración del webhook.');
  }
  contactForm.reset();
});
