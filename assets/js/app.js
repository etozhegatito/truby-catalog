/* ============================================================
   Главная страница: фильтры, сортировка, карточки каталога
   ============================================================ */

var state = {
  search: '', material: '', cat: '',
  dMin: null, dMax: null, sMin: null, sMax: null,
  gost: '', sort: 'pop'
};

document.addEventListener('DOMContentLoaded', function () {
  mountChrome('index.html');
  buildHeroArt();
  buildMaterialSelect();
  buildCatChips();
  bindFilters();

  var cat = qs('cat');
  if (cat && CATEGORIES.indexOf(cat) >= 0) state.cat = cat;

  document.getElementById('statCount').textContent = PIPES.length;
  render();
  updateCmpBadge();
});

/* ---------- герой: мозаика из сечений ---------- */
function buildHeroArt() {
  var picks = ['seamless-hot', 'ppu', 'hdpe', 'cast-iron-ductile', 'profile', 'pexal'];
  var html = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">';
  picks.forEach(function (slug) {
    var p = bySlug(slug);
    if (!p) return;
    html += '<a href="pipe.html?p=' + p.slug + '" style="text-align:center;text-decoration:none">' +
              '<div style="background:rgba(255,255,255,.06);border-radius:12px;padding:12px 8px">' +
                pipeIcon(p, 72, '#0a2337') +
                '<div style="font-size:11.5px;color:#a9c0d3;margin-top:6px;line-height:1.25">' + esc(p.shortName) + '</div>' +
              '</div></a>';
  });
  html += '</div>';
  document.getElementById('heroArt').innerHTML = html;
}

/* ---------- элементы фильтра ---------- */
function buildMaterialSelect() {
  var used = {};
  PIPES.forEach(function (p) { used[p.materialKey] = true; });
  var sel = document.getElementById('fMaterial');
  Object.keys(MATERIALS).forEach(function (k) {
    if (!used[k]) return;
    var o = document.createElement('option');
    o.value = k; o.textContent = MATERIALS[k].name;
    sel.appendChild(o);
  });
}

function buildCatChips() {
  var box = document.getElementById('catChips');
  var html = '<button class="chip" data-cat="">Все категории</button>';
  CATEGORIES.forEach(function (c) {
    var n = PIPES.filter(function (p) { return p.category === c; }).length;
    html += '<button class="chip" data-cat="' + esc(c) + '">' + esc(c) + ' <span style="opacity:.6">' + n + '</span></button>';
  });
  box.innerHTML = html;
  box.addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b) return;
    state.cat = b.getAttribute('data-cat');
    render();
  });
}

function bindFilters() {
  var map = {
    fSearch: 'search', fMaterial: 'material', fGost: 'gost', fSort: 'sort',
    fDmin: 'dMin', fDmax: 'dMax', fSmin: 'sMin', fSmax: 'sMax'
  };
  Object.keys(map).forEach(function (id) {
    var el = document.getElementById(id);
    el.addEventListener('input', function () {
      var v = el.value;
      state[map[id]] = (el.type === 'number') ? (v === '' ? null : parseFloat(v)) : v;
      render();
    });
  });
  document.getElementById('fReset').addEventListener('click', function () {
    ['fSearch', 'fMaterial', 'fGost', 'fDmin', 'fDmax', 'fSmin', 'fSmax'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
    state = { search: '', material: '', cat: '', dMin: null, dMax: null, sMin: null, sMax: null, gost: '', sort: state.sort };
    render();
  });
}

/* ---------- фильтрация ---------- */
function overlaps(aMin, aMax, bMin, bMax) {
  if (bMin === null && bMax === null) return true;
  var lo = bMin === null ? -Infinity : bMin;
  var hi = bMax === null ? Infinity : bMax;
  return aMax >= lo && aMin <= hi;
}

function match(p) {
  if (state.cat && p.category !== state.cat) return false;
  if (state.material && p.materialKey !== state.material) return false;

  if (!overlaps(p.f.dMin, p.f.dMax, state.dMin, state.dMax)) return false;
  if (!overlaps(p.f.sMin, p.f.sMax, state.sMin, state.sMax)) return false;

  if (state.gost.trim()) {
    var g = state.gost.trim().toLowerCase();
    var hay = p.gost.join(' ').toLowerCase();
    if (hay.indexOf(g) < 0) return false;
  }

  if (state.search.trim()) {
    var q = state.search.trim().toLowerCase();
    var text = [p.name, p.shortName, p.summary, p.keywords, p.category, materialName(p),
                p.uses.join(' '), p.industries.map(function (i) { return i.n; }).join(' ')]
                .join(' ').toLowerCase();
    var words = q.split(/\s+/);
    for (var i = 0; i < words.length; i++) if (text.indexOf(words[i]) < 0) return false;
  }
  return true;
}

function sortList(list) {
  var s = state.sort;
  return list.slice().sort(function (a, b) {
    if (s === 'name') return a.name.localeCompare(b.name, 'ru');
    if (s === 'dia') return a.f.dMax - b.f.dMax;
    if (s === 'cat') return a.category.localeCompare(b.category, 'ru') || b.popularity - a.popularity;
    return b.popularity - a.popularity || a.name.localeCompare(b.name, 'ru');
  });
}

/* ---------- отрисовка ---------- */
function render() {
  document.querySelectorAll('#catChips .chip').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-cat') === state.cat);
  });

  var list = sortList(PIPES.filter(match));
  var grid = document.getElementById('grid');
  var empty = document.getElementById('empty');

  document.getElementById('resultCount').textContent =
    'Найдено: ' + list.length + ' ' + plural(list.length, ['вид', 'вида', 'видов']) + ' труб';

  if (!list.length) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  grid.innerHTML = list.map(cardHTML).join('');

  grid.querySelectorAll('.cmp-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var slug = b.getAttribute('data-slug');
      if (!cmpToggle(slug)) { alert('Для сравнения можно выбрать не больше четырёх труб.'); return; }
      b.classList.toggle('on', cmpHas(slug));
      b.textContent = cmpHas(slug) ? '✓ В сравнении' : 'Сравнить';
      updateCmpBadge();
    });
  });
}

function cardHTML(p) {
  var inCmp = cmpHas(p.slug);
  return '' +
  '<article class="card">' +
    '<div class="card-media">' +
      '<span class="card-cat">' + esc(p.category) + '</span>' +
      pipeThumb(p) +
    '</div>' +
    '<div class="card-body">' +
      '<h3><a href="pipe.html?p=' + p.slug + '">' + esc(p.name) + '</a></h3>' +
      '<p class="card-desc">' + esc(trim(p.summary, 130)) + '</p>' +
      '<div class="card-meta">' +
        '<span class="tag">' + esc(materialName(p)) + '</span>' +
        '<span class="tag">Ø ' + esc(p.dia.split(';')[0].split('(')[0].trim()) + '</span>' +
        '<span class="tag accent">' + esc(p.gost[0].split('(')[0].trim()) + '</span>' +
      '</div>' +
      '<div class="card-foot">' +
        '<span title="' + demandWord(p.popularity) + '">' + stars(p.popularity) + '</span>' +
        '<button class="cmp-btn' + (inCmp ? ' on' : '') + '" data-slug="' + p.slug + '">' +
          (inCmp ? '✓ В сравнении' : 'Сравнить') + '</button>' +
      '</div>' +
    '</div>' +
  '</article>';
}

function trim(s, n) { return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s; }

function plural(n, forms) {
  var n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return forms[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
  return forms[2];
}
