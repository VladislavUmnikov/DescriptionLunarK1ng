import { siteConfig, portfolio, faqItems } from './config.js';

function renderTelegram(){
  const cfg = siteConfig.telegram;
  document.getElementById('tgCards').innerHTML = Object.values(cfg).map(t =>
    `<a class="tg-card" href="${t.url}" target="_blank" rel="noopener"><b>${t.title}</b><span>${t.desc}</span></a>`
  ).join('');
  document.getElementById('finalMain').href = cfg.main.url;
  document.getElementById('finalPersonal').href = cfg.personal.url;
}
renderTelegram();

function renderPortfolio(){
  const el = document.getElementById('portfolioContent');
  if(!portfolio.length){
    el.innerHTML = '<p class="note">Скоро здесь появятся новые работы — следите за Telegram-каналом.</p>';
    return;
  }
  el.innerHTML = portfolio.map(p => `
    <article class="pf-card">
      ${p.image ? `<img src="${p.image}" alt="" loading="lazy" style="width:100%;border-radius:8px;aspect-ratio:4/3;object-fit:cover;margin-bottom:.5rem">` : ''}
      <b>${p.title}</b><small>${p.category}${p.date ? ' · '+p.date : ''}</small>
      <p>${p.description || ''}</p>
      ${p.link ? `<a href="${p.link}" target="_blank" rel="noopener">Открыть проект →</a>` : ''}
    </article>`).join('');
}
renderPortfolio();

function renderFaq(){
  document.getElementById('faq').innerHTML = faqItems.map((f,i) => `
    <div class="faq-item">
      <button class="faq-q" aria-expanded="false" aria-controls="faq-a${i}">${f[0]}<span aria-hidden="true">+</span></button>
      <p class="faq-a" id="faq-a${i}" hidden>${f[1]}</p>
    </div>`).join('');
  document.querySelectorAll('.faq-q').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      document.getElementById(btn.getAttribute('aria-controls')).hidden = open;
    });
  });
}
renderFaq();

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const cards = document.querySelectorAll('#who .card');
const afterSelect = document.getElementById('afterSelect');
const activistSec = document.getElementById('activist');
const introEl = document.getElementById('profileIntro');
const introText = {
  teacher: "Коротко о том, как лучше общаться со мной в учебной обстановке.",
  student: "Коротко о моём слухе и практические советы для общения.",
  first: "Привет, я LunarK1ng. Вот самое важное обо мне.",
  activist: "Коротко о слухе — а ниже полный профиль обо мне."
};
cards.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    cards.forEach(c=>c.setAttribute('aria-pressed', c===btn ? 'true':'false'));
    introEl.textContent = introText[btn.dataset.p];
    afterSelect.hidden = false;
    activistSec.hidden = btn.dataset.p !== 'activist';
    afterSelect.scrollIntoView({behavior: reduce?'auto':'smooth', block:'start'});
  });
});
document.getElementById('backBtn').addEventListener('click', ()=>{
  afterSelect.hidden = true;
  cards.forEach(c=>c.setAttribute('aria-pressed','false'));
  document.getElementById('who').scrollIntoView({behavior: reduce?'auto':'smooth'});
});

document.querySelectorAll('.seg').forEach(s=>{
  s.addEventListener('click', ()=>{
    document.querySelectorAll('.seg').forEach(x=>x.setAttribute('aria-pressed', x===s?'true':'false'));
    document.querySelectorAll('.detail-more').forEach(el=> el.hidden = s.dataset.d !== 'more');
  });
});
