/* ============================================================
   Страница сравнения труб
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  mountChrome('compare.html');
  renderPicker('');
  renderTable();

  document.getElementById('pickSearch').addEventListener('input', function () {
    renderPicker(this.value.trim().toLowerCase());
  });
  document.getElementById('clearPick').addEventListener('click', function () {
    cmpSet([]); renderPicker(document.getElementById('pickSearch').value.trim().toLowerCase()); renderTable();
  });
});

function renderPicker(q) {
  var list = PIPES.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'ru'); });
  if (q) list = list.filter(function (p) {
    return (p.name + ' ' + p.shortName + ' ' + p.keywords + ' ' + p.category).toLowerCase().indexOf(q) >= 0;
  });

  var box = document.getElementById('picker');
  box.innerHTML = list.map(function (p) {
    var on = cmpHas(p.slug);
    return '<label class="pick-item' + (on ? ' on' : '') + '" data-slug="' + p.slug + '">' +
             pipeIcon(p, 30) +
             '<span>' + esc(p.shortName) + '</span>' +
           '</label>';
  }).join('') || '<div class="empty">Ничего не найдено</div>';

  box.querySelectorAll('.pick-item').forEach(function (el) {
    el.addEventListener('click', function () {
      var slug = el.getAttribute('data-slug');
      if (!cmpToggle(slug)) { alert('Можно сравнивать не больше четырёх труб. Снимите одну отметку.'); return; }
      el.classList.toggle('on', cmpHas(slug));
      renderTable();
      updatePickCount();
    });
  });
  updatePickCount();
}

function updatePickCount() {
  document.getElementById('pickCount').textContent = cmpGet().length;
}

var ROWS = [
  { k: 'Категория',            f: function (p) { return esc(p.category); } },
  { k: 'Материал',             f: function (p) { return esc(materialName(p)); } },
  { k: 'Плотность, кг/м³',     f: function (p) { return (MATERIALS[p.materialKey] || {}).density || '—'; } },
  { k: 'ГОСТ / ТУ',            f: function (p) { return p.gost.map(esc).join('<br>'); } },
  { k: 'Марка / состав',       f: function (p) { return esc(p.grades); } },
  { k: 'Наружный диаметр',     f: function (p) { return esc(p.dia); } },
  { k: 'Толщина стенки',       f: function (p) { return esc(p.wall); } },
  { k: 'Длина поставки',       f: function (p) { return esc(p.len); } },
  { k: 'Рабочее давление',     f: function (p) { return esc(p.pressure); } },
  { k: 'Температура',          f: function (p) { return esc(p.temp); } },
  { k: 'Тип шва',              f: function (p) { return esc(p.seam); } },
  { k: 'Покрытие / защита',    f: function (p) { return esc(p.coating); } },
  { k: 'Вес 1 м (типовой размер)', f: function (p) {
      var mid = p.sizes[Math.floor(p.sizes.length / 2)];
      var w = pipeWeight(p, mid[0], mid[1]);
      return '<b>' + fmt(w, 2) + ' кг/м</b><br><span style="color:var(--muted);font-size:12.5px">при ' + mid[0] + '×' + mid[1] + ' мм</span>';
    } },
  { k: 'Основные применения',  f: function (p) {
      return '<ul style="margin:0;padding-left:17px">' + p.uses.slice(0, 3).map(function (u) { return '<li>' + esc(u) + '</li>'; }).join('') + '</ul>';
    } },
  { k: 'Главная отрасль',      f: function (p) { return esc(p.industries[0].n) + ' — ' + p.industries[0].v + '%'; } },
  { k: 'Востребованность',     f: function (p) { return stars(p.popularity) + '<br><span style="color:var(--muted);font-size:12.5px">' + demandWord(p.popularity) + '</span>'; } },
  { k: 'С чем берут',          f: function (p) { return p.companions.slice(0, 3).map(function (c) { return esc(c.n); }).join('<br>'); } }
];

function renderTable() {
  var slugs = cmpGet();
  var out = document.getElementById('cmpOut');

  if (slugs.length < 2) {
    out.innerHTML = '<div class="empty"><h3>Выберите хотя бы две трубы</h3>' +
      '<p>Отметьте позиции в списке выше — таблица соберётся автоматически.</p></div>';
    return;
  }

  var pipes = slugs.map(bySlug).filter(Boolean);

  var head = '<tr><th style="width:190px"></th>' + pipes.map(function (p) {
    return '<th><div class="head-cell">' + pipeIcon(p, 36) +
           '<div><b><a href="pipe.html?p=' + p.slug + '">' + esc(p.shortName) + '</a></b>' +
           '<span>' + esc(p.category) + '</span></div></div></th>';
  }).join('') + '</tr>';

  var body = ROWS.map(function (r) {
    return '<tr><th>' + esc(r.k) + '</th>' + pipes.map(function (p) {
      return '<td>' + r.f(p) + '</td>';
    }).join('') + '</tr>';
  }).join('');

  out.innerHTML = '<div class="cmp-scroll"><table class="cmp-table">' +
    '<thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
    '<p class="note" style="margin-top:18px">Диапазоны характеристик приведены по всему сортаменту вида труб. ' +
    'Для конкретного типоразмера значения давления и температуры уточняйте по сертификату завода-изготовителя.</p>';
}
