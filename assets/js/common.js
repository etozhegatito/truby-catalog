/* ============================================================
   Общие функции: шапка, подвал, расчёт веса, мелкие утилиты.
   Подключается на каждой странице первым после data.js/visuals.js.
   ============================================================ */

var NAV = [
  { href: 'index.html',      label: 'Каталог' },
  { href: 'calculator.html', label: 'Калькулятор веса' },
  { href: 'compare.html',    label: 'Сравнение' },
  { href: 'faq.html',        label: 'FAQ' },
  { href: 'presentation.html', label: 'Презентация' }
];

function renderHeader(active) {
  var links = NAV.map(function (n) {
    var cls = n.href === active ? ' class="active"' : '';
    return '<a href="' + n.href + '"' + cls + '>' + n.label + '</a>';
  }).join('');

  return '' +
  '<header class="site-header">' +
    '<div class="container header-inner">' +
      '<a class="logo" href="index.html">' +
        '<span class="logo-mark">' +
          '<svg viewBox="0 0 40 40" aria-hidden="true">' +
            '<circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" stroke-width="3"/>' +
            '<circle cx="20" cy="20" r="9" fill="none" stroke="currentColor" stroke-width="3" opacity=".55"/>' +
          '</svg>' +
        '</span>' +
        '<span class="logo-text"><b>ТРУБПРОМ</b><em>справочник труб</em></span>' +
      '</a>' +
      '<nav class="main-nav" id="mainNav">' + links + '</nav>' +
      '<button class="nav-toggle" id="navToggle" aria-label="Меню">' +
        '<span></span><span></span><span></span>' +
      '</button>' +
    '</div>' +
  '</header>';
}

function renderFooter() {
  var cats = CATEGORIES.map(function (c) {
    return '<a href="index.html?cat=' + encodeURIComponent(c) + '">' + c + '</a>';
  }).join('');

  return '' +
  '<footer class="site-footer">' +
    '<div class="container footer-grid">' +
      '<div>' +
        '<div class="footer-logo">ТРУБПРОМ</div>' +
        '<p class="footer-note">Технический справочник по видам труб: конструкция, производство, ' +
        'область применения, сортамент и характеристики. Материал носит справочный характер — ' +
        'перед закупкой сверяйтесь с действующей редакцией ГОСТ и проектом.</p>' +
      '</div>' +
      '<div>' +
        '<h4>Категории</h4>' +
        '<div class="footer-links">' + cats + '</div>' +
      '</div>' +
      '<div>' +
        '<h4>Сервисы</h4>' +
        '<div class="footer-links">' +
          '<a href="calculator.html">Калькулятор веса трубы</a>' +
          '<a href="compare.html">Сравнение труб</a>' +
          '<a href="faq.html">Вопросы и ответы</a>' +
          '<a href="index.html">Полный каталог</a>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="container footer-bottom">' +
      '<span>© ТРУБПРОМ. Справочник по трубной продукции.</span>' +
      '<span>Данные приведены по ГОСТ, ТУ и типовым отраслевым практикам.</span>' +
    '</div>' +
  '</footer>';
}

function mountChrome(active) {
  var h = document.getElementById('header-slot');
  if (h) h.innerHTML = renderHeader(active);
  var f = document.getElementById('footer-slot');
  if (f) f.innerHTML = renderFooter();

  var t = document.getElementById('navToggle');
  if (t) {
    t.addEventListener('click', function () {
      document.getElementById('mainNav').classList.toggle('open');
      t.classList.toggle('open');
    });
  }
}

/* ---------- расчёт веса ---------- */
/* Круглая:      m = π · (D − s) · s · ρ
   Квадратная:   m ≈ 4 · (a − s) · s · ρ
   Прямоугольн.: m ≈ 2 · (a + b − 2s) · s · ρ
   Размеры в мм, плотность в кг/м³, результат — кг на 1 погонный метр. */
function weightRound(D, s, rho) {
  if (!(D > 0) || !(s > 0) || s * 2 >= D) return null;
  return Math.PI * (D - s) * s * rho / 1e6;
}
function weightSquare(a, s, rho) {
  if (!(a > 0) || !(s > 0) || s * 2 >= a) return null;
  return 4 * (a - s) * s * rho / 1e6;
}
function weightRect(a, b, s, rho) {
  if (!(a > 0) || !(b > 0) || !(s > 0) || s * 2 >= Math.min(a, b)) return null;
  return 2 * (a + b - 2 * s) * s * rho / 1e6;
}

/* calcDensity перекрывает плотность материала: у ППУ, ВУС, ЦПП и футерованных
   труб сортамент задан по стальной основе, поэтому и вес считается по стали. */
function pipeWeight(pipe, D, s) {
  var rho = pipe.calcDensity || (MATERIALS[pipe.materialKey] || {}).density || 7850;
  if (pipe.shape === 'square') return weightSquare(D, s, rho);
  return weightRound(D, s, rho);
}

function fmt(n, digits) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  digits = digits === undefined ? 2 : digits;
  return n.toFixed(digits).replace('.', ',').replace(/\s/g, ' ');
}

/* ---------- утилиты ---------- */
function qs(name) {
  var m = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
  return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
}
function bySlug(slug) {
  for (var i = 0; i < PIPES.length; i++) if (PIPES[i].slug === slug) return PIPES[i];
  return null;
}
function materialName(pipe) {
  var m = MATERIALS[pipe.materialKey];
  return m ? m.name : '—';
}
function stars(n) {
  var out = '';
  for (var i = 1; i <= 5; i++) out += '<span class="' + (i <= n ? 'on' : '') + '">●</span>';
  return '<span class="stars" title="Частота закупки: ' + n + ' из 5">' + out + '</span>';
}
function demandWord(n) {
  return ['', 'Редкий спрос', 'Нишевый спрос', 'Средний спрос', 'Высокий спрос', 'Очень высокий спрос'][n] || '';
}

/* Ссылки «сравнить» хранятся в localStorage, чтобы работать между страницами */
var CMP_KEY = 'trubprom_compare';
function cmpGet() {
  try { return JSON.parse(localStorage.getItem(CMP_KEY) || '[]'); } catch (e) { return []; }
}
function cmpSet(list) {
  try { localStorage.setItem(CMP_KEY, JSON.stringify(list.slice(0, 4))); } catch (e) {}
}
function cmpToggle(slug) {
  var l = cmpGet(), i = l.indexOf(slug);
  if (i >= 0) l.splice(i, 1); else if (l.length < 4) l.push(slug); else return false;
  cmpSet(l);
  return true;
}
function cmpHas(slug) { return cmpGet().indexOf(slug) >= 0; }

function updateCmpBadge() {
  var n = cmpGet().length;
  var el = document.getElementById('cmpBar');
  if (!el) return;
  if (!n) { el.classList.remove('show'); return; }
  el.classList.add('show');
  el.querySelector('.cmp-count').textContent = n;
  el.querySelector('.cmp-names').innerHTML = cmpGet().map(function (s) {
    var p = bySlug(s);
    return p ? '<span>' + esc(p.shortName) + '</span>' : '';
  }).join('');
}
