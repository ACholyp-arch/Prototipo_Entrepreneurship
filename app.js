// app.js
// Reemplaza la siguiente URL por la de tu webhook (Zapier / Make / tu endpoint)
const WEBHOOK_URL = 'https://hooks.example.com/your-webhook-url';

// UI elements
const modal = document.getElementById('modal');
const form = document.getElementById('contactForm');
const actions = document.querySelectorAll('[data-action]');
const closeBtn = document.getElementById('closeModal');

const STORAGE_KEY = 'rz_mvp_metrics_v1';
const defaultMetrics = { empresas: 0, solicitudes: 0, visitas: 120 };

// --- Modal controls ---
function openModal(intent) {
  form.dataset.intent = intent || 'contacto';
  document.getElementById('formIntent').value = intent || 'contacto';
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('company').focus();
}
function closeModalFn() {
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
}

// Add click handlers to CTA buttons
actions.forEach(btn => {
  btn.addEventListener('click', (e) => {
    const act = e.currentTarget.dataset.action;
    openModal(act);
  });
});

closeBtn.addEventListener('click', closeModalFn);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModalFn(); });

// --- Metrics localStorage helpers ---
function loadMetrics() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { ...defaultMetrics };
  } catch (e) {
    return { ...defaultMetrics };
  }
}
function saveMetrics(m) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
  updateUI(m);
}
function updateUI(m) {
  document.getElementById('count-emp').textContent = m.empresas;
  document.getElementById('count-solicitudes').textContent = m.solicitudes;
  document.getElementById('metric-emp').textContent = m.empresas;
  document.getElementById('metric-solic').textContent = m.solicitudes;
  const conv = m.visitas > 0 ? ((m.solicitudes / m.visitas) * 100).toFixed(1) : 0;
  document.getElementById('metric-conv').textContent = conv + '%';
}

// Demo simulate buttons
document.getElementById('demo-increment').addEventListener('click', () => {
  const m = loadMetrics();
  m.empresas += 1;
  saveMetrics(m);
});
document.getElementById('demo-solic').addEventListener('click', () => {
  const m = loadMetrics();
  m.solicitudes += 1;
  saveMetrics(m);
});

// --- Webhook submit helper ---
async function postToWebhook(payload) {
  if (!WEBHOOK_URL || WEBHOOK_URL.includes('example.com')) {
    // For safety: don't attempt real request if webhook not set
    console.warn('Webhook no configurado. Reemplaza WEBHOOK_URL en app.js con tu URL.');
    return { ok: false, message: 'Webhook no configurado (placeholder).' };
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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

// --- Form submit ---
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  // simple validation
  const company = form.company.value.trim();
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  if (!company || !name || !email) {
    alert('Por favor completa los campos obligatorios: Empresa, Nombre y Email.');
    return;
  }

  const payload = {
    intent: form.dataset.intent || 'contacto',
    company,
    name,
    email,
    notes: form.notes.value || '',
    ts: new Date().toISOString(),
    source: 'Landing MVP - Retención Gen Z',
  };

  // update local metrics (MVP behavior)
  const m = loadMetrics();
  m.empresas += 1;
  m.solicitudes += 1;
  saveMetrics(m);

  // Try to send to webhook (non-blocking behaviour but we await so user sees result)
  const result = await postToWebhook(payload);

  if (result.ok) {
    closeModalFn();
    alert('Gracias — solicitud registrada y enviada. Nos contactaremos pronto.');
    form.reset();
  } else {
    // If webhook fails, still keep the local record and inform user
    closeModalFn();
    alert('Solicitud registrada localmente. No se pudo enviar al webhook: ' + (result.message || result.error || result.text || 'Error desconocido') + '\n\nRevisa la configuración del webhook.');
    form.reset();
  }
});

// --- Init UI ---
updateUI(loadMetrics());
