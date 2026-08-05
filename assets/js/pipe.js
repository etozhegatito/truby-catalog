/* ============================================================
   Страница одного вида трубы: pipe.html?p=<slug>
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  mountChrome('');
  var slug = qs('p');
  var p = slug ? bySlug(slug) : null;
  var root = document.getElementById('pipeRoot');

  if (!p) {
    root.innerHTML = '<div class="container empty"><h2>Труба не найдена</h2>' +
      '<p>Возможно, ссылка устарела. Откройте каталог и выберите вид трубы.</p>' +
      '<a class="btn btn-primary" href="index.html">В каталог</a></div>';
    return;
  }

  document.title = p.name + ' — характеристики, ГОСТ, применение | ТРУБПРОМ';
  root.innerHTML = pageHTML(p);
  bindPage(p);
  updateCmpBadge();
});

function pageHTML(p) {
  return '' +
  '<div class="container">' +
    '<div class="breadcrumbs">' +
      '<a href="index.html">Каталог</a> / ' +
      '<a href="index.html?cat=' + encodeURIComponent(p.category) + '">' + esc(p.category) + '</a> / ' +
      '<span>' + esc(p.shortName) + '</span>' +
    '</div>' +

    /* ---------- шапка карточки ---------- */
    '<div class="pipe-hero">' +
      '<div class="pipe-visual">' +
        '<div class="stage">' + pipeThumb(p) + '</div>' +
        '<div class="stage" style="margin-top:12px">' + pipeSection(p) + '</div>' +
      '</div>' +
      '<div class="pipe-title">' +
        '<div class="kicker">' + esc(p.category) + ' · ' + esc(materialName(p)) + '</div>' +
        '<h1>' + esc(p.name) + '</h1>' +
        '<p class="pipe-lead">' + esc(p.summary) + '</p>' +
        '<div class="pipe-badges">' +
          badge('Востребованность', demandWord(p.popularity) + ' ' + stars(p.popularity)) +
          badge('Тип шва', p.seam) +
        '</div>' +
        '<div class="quick-specs">' +
          qspec('Наружный диаметр', p.dia) +
          qspec('Толщина стенки', p.wall) +
          qspec('Рабочее давление', p.pressure) +
          qspec('Температура', p.temp) +
          qspec('Длина', p.len) +
          qspec('Покрытие', p.coating) +
        '</div>' +
        '<div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap">' +
          '<button class="btn btn-primary" id="cmpAdd" data-slug="' + p.slug + '">Добавить к сравнению</button>' +
          '<a class="btn btn-outline" href="calculator.html?p=' + p.slug + '">Посчитать вес</a>' +
        '</div>' +
      '</div>' +
    '</div>' +

    /* ---------- основной контент ---------- */
    '<div class="content-grid">' +
      '<div>' +

        panel('Как производится',
          '<ol class="steps">' + p.production.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>') +

        panel('Для чего используют',
          '<ul class="ticks">' + p.uses.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>') +

        panel('Технические характеристики',
          '<table class="spec-table"><tbody>' +
            row('ГОСТ / ТУ', p.gost.map(function (g) { return '<b>' + esc(g) + '</b>'; }).join('<br>')) +
            row('Материал', esc(materialName(p)) +
              (p.calcDensity
                ? ' · расчётная плотность несущего слоя ' + p.calcDensity + ' кг/м³'
                : ' · плотность ' + ((MATERIALS[p.materialKey] || {}).density || '—') + ' кг/м³')) +
            row('Марка / состав', esc(p.grades)) +
            row('Наружный диаметр', esc(p.dia)) +
            row('Толщина стенки', esc(p.wall)) +
            row('Длина', esc(p.len)) +
            row('Рабочее давление', esc(p.pressure)) +
            row('Температурный диапазон', esc(p.temp)) +
            row('Тип шва', esc(p.seam)) +
            row('Покрытие / защита', esc(p.coating)) +
            row('Форма сечения', p.shape === 'square' ? 'Квадрат / прямоугольник' : (p.shape === 'corr' ? 'Круглая, гофрированная' : (p.shape === 'socket' ? 'Круглая, раструбная' : 'Круглая'))) +
          '</tbody></table>') +

        panel('Вес одного метра — популярные типоразмеры', weightTable(p) +
          (p.weightNote ? '<p class="note" style="margin-top:16px">' + esc(p.weightNote) + '</p>' : '') +
          '<p class="note" style="margin-top:16px">Значения теоретические: рассчитаны по номинальным размерам и плотности ' +
          'материала. Фактический вес партии обычно отличается на 1–5 % из-за допусков на толщину стенки и покрытия. ' +
          '<a href="calculator.html?p=' + p.slug + '">Посчитать свой размер →</a></p>') +

        panel('С чем продают — сопутствующие товары',
          '<p style="color:var(--muted)">Позиции, которые почти всегда заказывают вместе с этой трубой. ' +
          'Проверьте комплектность до отгрузки — доборы обычно и тормозят монтаж.</p>' +
          '<div class="companions">' + p.companions.map(function (c) {
            return '<div class="comp-item"><b>' + esc(c.n) + '</b><span>' + esc(c.d) + '</span></div>';
          }).join('') + '</div>') +

        panel('Как часто покупают и какие отрасли',
          '<p>' + esc(p.buying) + '</p>' +
          '<h3>Распределение спроса по отраслям</h3>' +
          '<div class="bars">' + p.industries.map(function (i) {
            return '<div class="bar-row"><div><div class="lbl">' + esc(i.n) + '</div>' +
                   '<div class="bar-track"><div class="bar-fill" style="width:' + i.v + '%"></div></div></div>' +
                   '<div class="val">' + i.v + '%</div></div>';
          }).join('') + '</div>' +
          '<p style="color:var(--muted);font-size:13px;margin-top:14px;margin-bottom:0">' +
          'Оценка типового распределения по отраслевой практике; в конкретном регионе доли могут отличаться.</p>') +

      '</div>' +

      /* ---------- сайдбар ---------- */
      '<aside class="sidebar">' +
        supplierBox() +
        sideSimilar(p) +
        sideServices(p) +
      '</aside>' +
    '</div>' +
  '</div>';
}

/* ---------- вспомогательные шаблоны ---------- */
function panel(title, body) {
  return '<section class="panel"><h2>' + esc(title) + '</h2>' + body + '</section>';
}
function row(k, v) { return '<tr><th>' + esc(k) + '</th><td>' + v + '</td></tr>'; }
function badge(k, v) { return '<div class="badge"><b>' + esc(k) + '</b>' + v + '</div>'; }
function qspec(k, v) { return '<div><span>' + esc(k) + '</span><b>' + esc(v) + '</b></div>'; }

function weightTable(p) {
  var isSq = p.shape === 'square';
  var rows = p.sizes.map(function (s) {
    var D = s[0], w = s[1];
    var kg = pipeWeight(p, D, w);
    var inner = isSq ? (D - 2 * w) : (D - 2 * w);
    var perTon = kg ? 1000 / kg : null;
    var vol = kg ? Math.PI * Math.pow(inner / 2000, 2) * 1000 : null; /* литров в метре */
    return '<tr>' +
      '<td class="num"><b>' + (isSq ? D + '×' + D : '⌀ ' + D) + '</b></td>' +
      '<td class="num">' + fmt(w, w % 1 === 0 ? 0 : 1) + '</td>' +
      '<td class="num">' + fmt(inner, 1) + '</td>' +
      '<td class="num"><b>' + fmt(kg, 2) + '</b></td>' +
      '<td class="num">' + fmt(perTon, 1) + '</td>' +
      (isSq ? '' : '<td class="num">' + fmt(vol, 2) + '</td>') +
    '</tr>';
  }).join('');

  return '<div style="overflow-x:auto"><table class="w-table"><thead><tr>' +
    '<th>' + (isSq ? 'Сечение, мм' : 'Наружный ⌀, мм') + '</th>' +
    '<th>Стенка, мм</th>' +
    '<th>' + (isSq ? 'Внутр. размер, мм' : 'Внутр. ⌀, мм') + '</th>' +
    '<th>Вес 1 м, кг</th>' +
    '<th>Метров в тонне</th>' +
    (isSq ? '' : '<th>Объём, л/м</th>') +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function supplierBox() {
  return '' +
  '<div class="supplier-box">' +
    '<div class="supplier-icon">' +
      '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>' +
      '</svg>' +
    '</div>' +
    '<h3>Здесь будет контакт поставщика</h3>' +
    '<p>Блок зарезервирован под название компании, телефон, почту и кнопку запроса цены.</p>' +
    '<div class="placeholder-line w70"></div>' +
    '<div class="placeholder-line w50"></div>' +
    '<div class="placeholder-line w70"></div>' +
    '<div class="supplier-note">Раздел не заполнен. Контакты поставщика добавляются администратором сайта.</div>' +
  '</div>';
}

function sideSimilar(p) {
  var similar = PIPES.filter(function (x) {
    return x.slug !== p.slug && (x.category === p.category || x.materialKey === p.materialKey);
  }).sort(function (a, b) { return b.popularity - a.popularity; }).slice(0, 6);

  if (!similar.length) return '';
  return '<div class="side-card"><h4>Похожие виды труб</h4><div class="side-list">' +
    similar.map(function (x) {
      return '<a href="pipe.html?p=' + x.slug + '">' + pipeIcon(x, 30) + '<span>' + esc(x.name) + '</span></a>';
    }).join('') + '</div></div>';
}

function sideServices(p) {
  return '<div class="side-card"><h4>Полезное</h4><div class="side-list">' +
    '<a href="calculator.html?p=' + p.slug + '">Калькулятор веса для этой трубы</a>' +
    '<a href="compare.html">Сравнить с другими видами</a>' +
    '<a href="faq.html">FAQ: как выбрать трубу</a>' +
    '<a href="index.html?cat=' + encodeURIComponent(p.category) + '">Все трубы категории «' + esc(p.category) + '»</a>' +
  '</div></div>';
}

/* ---------- события ---------- */
function bindPage(p) {
  var btn = document.getElementById('cmpAdd');
  function sync() {
    var on = cmpHas(p.slug);
    btn.textContent = on ? '✓ Добавлено к сравнению' : 'Добавить к сравнению';
    btn.className = on ? 'btn btn-outline' : 'btn btn-primary';
  }
  btn.addEventListener('click', function () {
    if (!cmpToggle(p.slug)) { alert('Для сравнения можно выбрать не больше четырёх труб.'); return; }
    sync(); updateCmpBadge();
  });
  sync();
}
