/* ============================================================
   Калькулятор веса трубы
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  mountChrome('calculator.html');
  fillMaterials();
  fillPresets();
  bind();

  var slug = qs('p');
  if (slug && bySlug(slug)) {
    document.getElementById('cPreset').value = slug;
    applyPreset();
  }
  calc();
});

function fillMaterials() {
  var sel = document.getElementById('cMaterial');
  Object.keys(MATERIALS).forEach(function (k) {
    var o = document.createElement('option');
    o.value = k;
    o.textContent = MATERIALS[k].name + ' — ' + MATERIALS[k].density + ' кг/м³';
    sel.appendChild(o);
  });
  sel.value = 'steel';
}

function fillPresets() {
  var sel = document.getElementById('cPreset');
  PIPES.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'ru'); }).forEach(function (p) {
    var o = document.createElement('option');
    o.value = p.slug;
    o.textContent = p.name;
    sel.appendChild(o);
  });
}

function bind() {
  ['cShape', 'cMaterial', 'cD', 'cB', 'cS', 'cRho', 'cLen', 'cQty'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', function () {
      if (id === 'cMaterial') {
        document.getElementById('cRho').value = MATERIALS[this.value].density;
      }
      if (id === 'cShape') syncShape();
      calc();
    });
  });
  document.getElementById('cPreset').addEventListener('change', function () { applyPreset(); calc(); });
  syncShape();
}

function syncShape() {
  var shape = document.getElementById('cShape').value;
  document.getElementById('fldB').style.display = (shape === 'rect') ? '' : 'none';
  var lbl = document.querySelector('#fldD label');
  lbl.textContent = shape === 'round' ? 'Наружный диаметр D, мм'
                  : shape === 'square' ? 'Сторона A, мм' : 'Сторона A, мм';
}

function applyPreset() {
  var slug = document.getElementById('cPreset').value;
  var p = slug ? bySlug(slug) : null;
  var hint = document.getElementById('calcHint');
  if (!p) {
    hint.innerHTML = 'Плотность подставляется автоматически при выборе материала, но её можно изменить вручную.';
    return;
  }
  document.getElementById('cShape').value = (p.shape === 'square') ? 'square' : 'round';
  syncShape();
  document.getElementById('cMaterial').value = p.materialKey;
  /* у многослойных труб сортамент задан по несущему слою — берём его плотность */
  document.getElementById('cRho').value = p.calcDensity || (MATERIALS[p.materialKey] || {}).density || 7850;

  var mid = p.sizes[Math.floor(p.sizes.length / 2)];
  document.getElementById('cD').value = mid[0];
  document.getElementById('cS').value = mid[1];

  hint.innerHTML = 'Подставлен типовой размер трубы «<b>' + esc(p.name) + '</b>»: ' +
    mid[0] + '×' + mid[1] + ' мм, ' + esc(materialName(p)) + '. ' +
    'Диапазон производства: ' + esc(p.dia) + ', стенка ' + esc(p.wall) + '. ' +
    '<a href="pipe.html?p=' + p.slug + '">Открыть карточку трубы →</a>';
}

function calc() {
  var shape = document.getElementById('cShape').value;
  var D = parseFloat(document.getElementById('cD').value);
  var B = parseFloat(document.getElementById('cB').value);
  var s = parseFloat(document.getElementById('cS').value);
  var rho = parseFloat(document.getElementById('cRho').value);
  var len = parseFloat(document.getElementById('cLen').value);
  var qty = parseInt(document.getElementById('cQty').value, 10);

  var kg = null, inner = '', vol = null, area = null, formula = '';

  if (shape === 'round') {
    kg = weightRound(D, s, rho);
    inner = fmt(D - 2 * s, 1) + ' мм';
    vol = (D - 2 * s) > 0 ? Math.PI * Math.pow((D - 2 * s) / 2000, 2) * 1000 : null;
    area = D > 0 ? Math.PI * D / 1000 : null;
    formula = 'm = π · (D − s) · s · ρ / 10⁶ = π · (' + fmt(D, 1) + ' − ' + fmt(s, 1) + ') · ' + fmt(s, 1) + ' · ' + rho + ' / 10⁶';
  } else if (shape === 'square') {
    kg = weightSquare(D, s, rho);
    inner = fmt(D - 2 * s, 1) + ' × ' + fmt(D - 2 * s, 1) + ' мм';
    vol = (D - 2 * s) > 0 ? Math.pow((D - 2 * s) / 1000, 2) * 1000 : null;
    area = D > 0 ? 4 * D / 1000 : null;
    formula = 'm = 4 · (A − s) · s · ρ / 10⁶ = 4 · (' + fmt(D, 1) + ' − ' + fmt(s, 1) + ') · ' + fmt(s, 1) + ' · ' + rho + ' / 10⁶';
  } else {
    kg = weightRect(D, B, s, rho);
    inner = fmt(D - 2 * s, 1) + ' × ' + fmt(B - 2 * s, 1) + ' мм';
    vol = (D - 2 * s) > 0 && (B - 2 * s) > 0 ? ((D - 2 * s) / 1000) * ((B - 2 * s) / 1000) * 1000 : null;
    area = (D > 0 && B > 0) ? 2 * (D + B) / 1000 : null;
    formula = 'm = 2 · (A + B − 2s) · s · ρ / 10⁶ = 2 · (' + fmt(D, 1) + ' + ' + fmt(B, 1) + ' − 2·' + fmt(s, 1) + ') · ' + fmt(s, 1) + ' · ' + rho + ' / 10⁶';
  }

  var ok = kg !== null && isFinite(kg) && kg > 0;

  document.getElementById('rKg').innerHTML = (ok ? fmt(kg, 3) : '—') + '<small> кг/м</small>';
  document.getElementById('rDesc').textContent = ok
    ? 'Теоретический вес погонного метра'
    : 'Проверьте размеры: удвоенная стенка не может быть больше габарита';

  var pieceKg = (ok && len > 0) ? kg * len : null;
  var totalKg = (pieceKg !== null && qty > 0) ? pieceKg * qty : null;

  document.getElementById('rPiece').textContent = pieceKg !== null ? fmt(pieceKg, 2) + ' кг' : '—';
  document.getElementById('rTotal').textContent = totalKg !== null
    ? (totalKg >= 1000 ? fmt(totalKg / 1000, 3) + ' т' : fmt(totalKg, 1) + ' кг') : '—';
  document.getElementById('rPerTon').textContent = ok ? fmt(1000 / kg, 1) + ' м' : '—';
  document.getElementById('rVol').textContent = vol !== null && isFinite(vol) ? fmt(vol, 2) + ' л/м' : '—';
  document.getElementById('rArea').textContent = area !== null && isFinite(area) ? fmt(area, 3) + ' м²/м' : '—';
  document.getElementById('rInner').textContent = ok ? inner : '—';

  document.getElementById('rFormula').innerHTML = ok
    ? 'Формула расчёта:<br><code>' + formula + '</code>'
    : '';
}
