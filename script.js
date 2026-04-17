const MAX_SAVINGS = 1500;
const ARC_LEN     = 377;

const state = {
  phoneBase: 0,
  tradeIn:   null,
  step:      1
};

let displayed = 0;

function calcSavings() {
  if (state.phoneBase === 0) return 0;
  const baseGap    = 240;
  const phoneBonus = state.phoneBase;
  const tradeBoost = state.tradeIn ? state.tradeIn / 3 : 0;
  const step1      = Math.round(baseGap + phoneBonus * 0.7);
  return state.tradeIn === null ? step1 : Math.round(step1 + tradeBoost);
}

function animateMeter(target, badge) {
  const meterNum = document.getElementById('meterNum');
  const fillArc  = document.getElementById('fillArc');
  const meter    = document.getElementById('meter');

  meter.classList.remove('is-pulsing');
  void meter.offsetWidth;
  meter.classList.add('is-pulsing');

  const pct = Math.min(target / MAX_SAVINGS, 1);
  fillArc.style.strokeDasharray = (pct * ARC_LEN).toFixed(1) + ' ' + ARC_LEN;

  const from = displayed;
  const diff = target - from;
  const dur  = 900;
  const t0   = performance.now();

  function tick(now) {
    const p    = Math.min((now - t0) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    meterNum.textContent = '$' + Math.round(from + diff * ease).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
    else displayed = target;
  }
  requestAnimationFrame(tick);

  const badgeStep = badge !== undefined ? badge : state.step;
  setTimeout(() => { if (badgeStep !== null) triggerBadge(badgeStep); }, 400);
}

const BADGES = {
  2: 'Get up to $1,100 trade-in credit'
};

function triggerBadge(step) {
  const el = document.getElementById('meter-badge');
  document.getElementById('meter-badge-text').textContent = BADGES[step] || '';
  el.classList.remove('is-visible');
  void el.offsetWidth;
  if (BADGES[step]) el.classList.add('is-visible');
}

function spawnConfetti() {
  const meter = document.getElementById('meter');
  const cs = getComputedStyle(document.documentElement);
  const confettiColors = [
    '--color-blue-dark',
    '--color-lime',
    '--color-blue-light',
    '--color-ink',
    '--color-amber',
  ].map(t => cs.getPropertyValue(t).trim());

  for (let i = 0; i < 14; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.background = confettiColors[i % confettiColors.length];
    c.style.left = (50 + (Math.random() - 0.5) * 20) + '%';
    c.style.top  = '55%';
    meter.appendChild(c);

    const dx  = (Math.random() - 0.5) * 280;
    const dy  = -80 - Math.random() * 60;
    const rot = (Math.random() - 0.5) * 540;

    c.animate([
      { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx}px,${dy}px) rotate(${rot}deg)`, opacity: 0 }
    ], { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.3,1)' });

    setTimeout(() => c.remove(), 1400);
  }
}

function advanceStep(to) {
  state.step = to;
  if (to === 2) {
    document.getElementById('phone-marker').classList.add('is-complete');
    document.getElementById('step-phone').classList.add('is-complete');
    document.getElementById('step-phone-title').textContent = 'Your new phone';
    document.getElementById('step-trade').classList.remove('is-locked');
  }
  if (to === 3) {
    document.getElementById('trade-marker').classList.add('is-complete');
    document.getElementById('cta').classList.add('is-visible');
  }
}

document.getElementById('phone-select').addEventListener('change', function () {
  state.phoneBase = +this.options[this.selectedIndex].dataset.base;
  animateMeter(calcSavings());
  spawnConfetti();
  if (state.step === 1) setTimeout(() => advanceStep(2), 600);
});

const tradeToggle = document.getElementById('trade-toggle');
const tradeSelect = document.getElementById('trade-select');

tradeToggle.addEventListener('click', function () {
  const isOn = this.getAttribute('aria-checked') === 'true';
  const nowOn = !isOn;
  this.setAttribute('aria-checked', String(nowOn));
  this.classList.toggle('is-off', !nowOn);
  tradeSelect.disabled = !nowOn;

  if (!nowOn) {
    // Toggle OFF = no trade-in
    state.tradeIn = 0;
    animateMeter(calcSavings(), null);
    if (state.step === 2) setTimeout(() => advanceStep(3), 600);
  } else {
    // Toggle ON — restore dropdown selection if any
    state.tradeIn = tradeSelect.value ? +tradeSelect.value : null;
    animateMeter(calcSavings(), null);
  }
});

tradeSelect.addEventListener('change', function () {
  state.tradeIn = +this.value;
  animateMeter(calcSavings());
  spawnConfetti();
  document.getElementById('step-trade').classList.add('is-complete');
  document.getElementById('trade-marker').classList.add('is-complete');
  document.getElementById('step-trade-title').textContent = 'Trade-in phone';
  if (state.step === 2) setTimeout(() => advanceStep(3), 600);
});
