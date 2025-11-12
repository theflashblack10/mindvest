// ======= CONFIGURAÇÕES INICIAIS =======
// Substitua esses links pelo checkout real da Stripe depois
const STRIPE_MONTHLY_LINK = "https://buy.stripe.com/test_monthly_PLACEHOLDER";
const STRIPE_ANNUAL_LINK  = "https://buy.stripe.com/test_annual_PLACEHOLDER";

// ======= ELEMENTOS PRINCIPAIS =======
const body = document.body;
const themeToggle = document.getElementById('theme-toggle');
const counterEl = document.getElementById('investor-count');
const startBtn = document.getElementById('start-quiz-btn');
const quizModal = document.getElementById('quiz-modal');
const closeQuizBtn = document.getElementById('close-quiz');
const quizForm = document.getElementById('quiz-form');
const resultSection = document.getElementById('result-section');
const profileNameEl = document.getElementById('profile-name');
const profileDescEl = document.getElementById('profile-desc');
const freeListEl = document.getElementById('free-list');
const unlockBtn = document.getElementById('unlock-premium');
const premiumModal = document.getElementById('premium-modal');
const closePremium = document.getElementById('close-premium');
const stripeMonthlyBtn = document.getElementById('stripe-monthly');
const stripeAnnualBtn = document.getElementById('stripe-annual');
const langSelect = document.getElementById('lang-select');

let CURRENT_LANG = 'pt'; // idioma padrão
let conteudo = null;

// ======= TEMA (claro/escuro) =======
themeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  const isDark = body.classList.contains('dark-mode');
  themeToggle.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('mindvestTheme', isDark ? 'dark' : 'light');
});

(function initTheme() {
  const saved = localStorage.getItem('mindvestTheme');
  if (saved === 'dark') {
    body.classList.add('dark-mode');
    themeToggle.textContent = '☀️';
  }
})();

// ======= CONTADOR DINÂMICO =======
let count = localStorage.getItem('mindvestCount')
  ? parseInt(localStorage.getItem('mindvestCount'))
  : 3000;

function animateCounter(target) {
  let current = count;
  const increment = Math.floor(Math.random() * 10) + 1;
  const interval = setInterval(() => {
    if (current >= target) {
      clearInterval(interval);
      count = current;
      localStorage.setItem('mindvestCount', count);
    } else {
      current += increment;
      counterEl.textContent = `+${current.toLocaleString(getLocaleByLang(CURRENT_LANG))}`;
    }
  }, 40);
}

const targetCount = count + Math.floor(Math.random() * 50) + 10;
animateCounter(targetCount);

// ======= DETECÇÃO DE IDIOMA =======
function detectLanguage() {
  const navLang = navigator.language || navigator.userLanguage || 'pt-BR';
  if (navLang.startsWith('es')) return 'es';
  if (navLang.startsWith('en')) return 'en';
  return 'pt';
}
function getLocaleByLang(lang) {
  if (lang === 'pt') return 'pt-BR';
  if (lang === 'es') return 'es-AR';
  return 'en-US';
}

(function initLang() {
  const saved = localStorage.getItem('mindvestLang');
  let lang = saved || 'auto';
  if (lang === 'auto') lang = detectLanguage();
  CURRENT_LANG = lang === 'auto' ? detectLanguage() : lang;
  langSelect.value = saved || 'auto';
  applyLang();
})();

langSelect.addEventListener('change', (e) => {
  const v = e.target.value;
  if (v === 'auto') {
    CURRENT_LANG = detectLanguage();
    localStorage.removeItem('mindvestLang');
  } else {
    CURRENT_LANG = v;
    localStorage.setItem('mindvestLang', v);
  }
  applyLang();
});

// ======= CARREGAMENTO DE CONTEÚDO =======
async function loadContent() {
  try {
    const res = await fetch('conteudo.json');
    conteudo = await res.json();
    renderStaticTexts();
    renderFreeContent();
    setupStripeLinks();
  } catch (err) {
    console.error('Erro ao carregar conteudo.json', err);
  }
}

// ======= TEXTOS =======
function t(key) {
  if (!conteudo || !conteudo.texts) return key;
  const obj = conteudo.texts[key];
  if (!obj) return key;
  return obj[CURRENT_LANG] || obj['pt'] || key;
}

function renderStaticTexts() {
  document.getElementById('headline').textContent = t('headline');
  document.getElementById('subhead').textContent = t('subhead');
  document.getElementById('start-quiz-btn').textContent = t('start_quiz');
  document.getElementById('quiz-title').textContent = t('quiz_title');
  document.getElementById('investor-text').textContent = t('investor_text');
  document.getElementById('premium-title').textContent = t('premium_title');
  document.getElementById('premium-sub').textContent = t('premium_sub');
  document.getElementById('unlock-premium').textContent = t('unlock_premium');
  document.querySelectorAll('.buy-btn').forEach(b => {
    if (b.id === 'stripe-annual') b.textContent = t('buy_annual');
    else b.textContent = t('buy_monthly');
  });
}

// ======= CONTEÚDO GRATUITO =======
function renderFreeContent() {
  if (!conteudo) return;
  const list = conteudo.free || [];
  freeListEl.innerHTML = '';
  list.forEach(item => {
    const title = item['titulo_' + CURRENT_LANG] || item.titulo_pt;
    const desc = item['descricao_' + CURRENT_LANG] || item.descricao_pt;
    const el = document.createElement('div');
    el.className = 'content-item';
    el.innerHTML = `<strong>${title}</strong><p style="color:var(--muted);font-size:14px">${desc}</p>`;
    freeListEl.appendChild(el);
  });
}

// ======= STRIPE PLACEHOLDERS =======
function setupStripeLinks() {
  stripeMonthlyBtn.href = STRIPE_MONTHLY_LINK;
  stripeAnnualBtn.href = STRIPE_ANNUAL_LINK;
}

// ======= QUIZ =======
startBtn.addEventListener('click', () => openModal(quizModal));
closeQuizBtn.addEventListener('click', () => closeModal(quizModal));
closePremium.addEventListener('click', () => closeModal(premiumModal));
unlockBtn.addEventListener('click', () => openModal(premiumModal));

quizForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(quizForm);
  const answers = {};
  for (const [k, v] of data.entries()) answers[k] = v;
  const profile = calculateProfile(answers);
  saveProfile(profile);
  showResult(profile);
  closeModal(quizModal);
});

function openModal(el) { el.classList.remove('hidden'); }
function closeModal(el) { el.classList.add('hidden'); }

function calculateProfile(a) {
  let score = 0;
  const map = {
    q0: { curto: 1, medio: 2, longo: 3 },
    q1: { vender: 1, manter: 2, comprar: 3 },
    q2: { nenhum: 1, algumas: 2, muito: 3 },
    q3: { "0-3": 1, "3-6": 2, "6+": 3 },
    q4: { baixo: 1, medio: 2, alto: 3 }
  };
  for (let i = 0; i < 5; i++) {
    const key = 'q' + i;
    const val = a[key];
    if (map[key] && map[key][val]) score += map[key][val];
  }
  if (score <= 7)
    return { key: 'conservador', name: t('profile_conservative'), desc: t('desc_conservative') };
  if (score <= 11)
    return { key: 'moderado', name: t('profile_moderate'), desc: t('desc_moderate') };
  return { key: 'agressivo', name: t('profile_aggressive'), desc: t('desc_aggressive') };
}

function saveProfile(p) {
  localStorage.setItem('mindvest_profile', JSON.stringify(p));
}

function showResult(p) {
  profileNameEl.textContent = `${t('profile_label')} ${p.name}`;
  profileDescEl.textContent = p.desc;
  resultSection.classList.remove('hidden');
  window.scrollTo({ top: resultSection.offsetTop - 20, behavior: 'smooth' });
}

// ======= EXECUÇÃO =======
loadContent();
(function tryShowSaved() {
  const saved = localStorage.getItem('mindvest_profile');
  if (saved) showResult(JSON.parse(saved));
})();

stripeMonthlyBtn.addEventListener('click', () => localStorage.setItem('mindvest_premium_status', 'pending'));
stripeAnnualBtn.addEventListener('click', () => localStorage.setItem('mindvest_premium_status', 'pending'));
