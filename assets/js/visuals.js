/* ============================================================
   Генератор изображений труб.
   Ни одной внешней картинки: и «фото» в каталоге, и схема сечения
   рисуются векторно прямо в браузере из полей pipe.visual.
   Поэтому сайт работает без интернета и весит копейки.
   ============================================================ */

/* ---------- работа с цветом ---------- */
function hexToRgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbToHex(r) {
  return '#' + r.map(function (v) {
    var s = Math.max(0, Math.min(255, Math.round(v))).toString(16);
    return s.length === 1 ? '0' + s : s;
  }).join('');
}
function shade(hex, amount) {
  var c = hexToRgb(hex);
  var target = amount > 0 ? 255 : 0;
  var k = Math.abs(amount);
  return rgbToHex(c.map(function (v) { return v + (target - v) * k; }));
}

/* уникальный id, чтобы градиенты разных SVG не конфликтовали */
var _uid = 0;
function uid(prefix) { _uid += 1; return prefix + '_' + _uid; }

function pipeBaseColor(pipe) {
  if (pipe.visual && pipe.visual.layers && pipe.visual.layers.length) {
    return pipe.visual.layers[0].c;
  }
  var m = MATERIALS[pipe.materialKey];
  return m ? m.color : '#8d99a6';
}

/* ============================================================
   1. «Фотография» трубы — объёмный вид для карточки каталога
   ============================================================ */
function pipeThumb(pipe) {
  var v = pipe.visual || {};
  var base = pipeBaseColor(pipe);
  var layers = v.layers && v.layers.length ? v.layers : [{ n: 'Материал', c: base, t: 1 }];
  var wf = v.wallFrac || 0.18;

  var gBody = uid('gb'), gFace = uid('gf'), gShine = uid('gs');
  var light = shade(base, 0.42), lighter = shade(base, 0.62), dark = shade(base, -0.34), darker = shade(base, -0.55);

  var defs =
    '<defs>' +
      '<linearGradient id="' + gBody + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="' + shade(base, -0.28) + '"/>' +
        '<stop offset="18%" stop-color="' + light + '"/>' +
        '<stop offset="34%" stop-color="' + lighter + '"/>' +
        '<stop offset="58%" stop-color="' + base + '"/>' +
        '<stop offset="100%" stop-color="' + darker + '"/>' +
      '</linearGradient>' +
      '<linearGradient id="' + gFace + '" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="' + shade(base, 0.3) + '"/>' +
        '<stop offset="100%" stop-color="' + shade(base, -0.3) + '"/>' +
      '</linearGradient>' +
      '<linearGradient id="' + gShine + '" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0%" stop-color="#fff" stop-opacity="0"/>' +
        '<stop offset="45%" stop-color="#fff" stop-opacity=".55"/>' +
        '<stop offset="100%" stop-color="#fff" stop-opacity="0"/>' +
      '</linearGradient>' +
    '</defs>';

  var svg = '<svg class="pipe-thumb" viewBox="0 0 340 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(pipe.name) + '">' + defs;

  /* тень под трубой */
  svg += '<ellipse cx="180" cy="176" rx="126" ry="11" fill="#0f172a" opacity=".14"/>';

  if (pipe.shape === 'square') {
    svg += squareBody(pipe, gBody, gFace, base, wf);
  } else {
    svg += roundBody(pipe, gBody, gShine, base, layers, wf, v);
  }

  svg += '</svg>';
  return svg;
}

function roundBody(pipe, gBody, gShine, base, layers, wf, v) {
  var x0 = 48, x1 = 288, cy = 100, ry = 52, rx = 20;
  var s = '';

  /* дальний торец */
  s += '<ellipse cx="' + x1 + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + shade(base, -0.45) + '"/>';

  /* тело */
  if (v.corrugated) {
    s += '<path d="M' + x0 + ' ' + (cy - ry) + ' H' + x1 + ' A' + rx + ' ' + ry + ' 0 0 1 ' + x1 + ' ' + (cy + ry) +
         ' H' + x0 + ' Z" fill="url(#' + gBody + ')"/>';
    for (var gx = x0 + 14; gx < x1 - 4; gx += 17) {
      s += '<path d="M' + gx + ' ' + (cy - ry) + ' A' + rx + ' ' + ry + ' 0 0 0 ' + gx + ' ' + (cy + ry) +
           '" fill="none" stroke="' + shade(base, -0.5) + '" stroke-opacity=".55" stroke-width="4"/>';
      s += '<path d="M' + (gx + 5) + ' ' + (cy - ry) + ' A' + rx + ' ' + ry + ' 0 0 0 ' + (gx + 5) + ' ' + (cy + ry) +
           '" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="3"/>';
    }
  } else {
    s += '<path d="M' + x0 + ' ' + (cy - ry) + ' H' + x1 + ' A' + rx + ' ' + ry + ' 0 0 1 ' + x1 + ' ' + (cy + ry) +
         ' H' + x0 + ' Z" fill="url(#' + gBody + ')"/>';
    s += '<rect x="' + (x0 + 6) + '" y="' + (cy - ry + 12) + '" width="' + (x1 - x0 - 30) + '" height="10" fill="url(#' + gShine + ')" opacity=".7"/>';
  }

  /* спиральный шов */
  if (v.spiral) {
    for (var sx = x0 - 30; sx < x1; sx += 62) {
      s += '<path d="M' + sx + ' ' + (cy + ry) + ' Q ' + (sx + 30) + ' ' + cy + ' ' + (sx + 62) + ' ' + (cy - ry) +
           '" fill="none" stroke="' + shade(base, -0.42) + '" stroke-width="2.4" opacity=".7"/>';
    }
    s += '<rect x="' + x0 + '" y="' + (cy - ry) + '" width="' + (x1 - x0) + '" height="' + (2 * ry) + '" fill="none"/>';
  }

  /* продольный шов */
  if (v.seamLine) {
    s += '<line x1="' + x0 + '" y1="' + (cy - ry + 16) + '" x2="' + x1 + '" y2="' + (cy - ry + 16) +
         '" stroke="' + shade(base, -0.4) + '" stroke-width="2.5" opacity=".65"/>';
  }

  /* цветная полоса маркировки (ПНД) */
  if (v.stripe) {
    s += '<rect x="' + x0 + '" y="' + (cy - 26) + '" width="' + (x1 - x0) + '" height="7" fill="' + v.stripe + '" opacity=".95"/>';
  }

  /* резьба на дальнем конце */
  if (v.thread) {
    for (var t = 0; t < 7; t++) {
      var tx = x1 - 54 + t * 8;
      s += '<path d="M' + tx + ' ' + (cy - ry) + ' A' + rx + ' ' + ry + ' 0 0 0 ' + tx + ' ' + (cy + ry) +
           '" fill="none" stroke="' + shade(base, -0.4) + '" stroke-width="2" opacity=".6"/>';
    }
  }

  /* муфта */
  if (v.coupling) {
    s += '<path d="M' + (x1 - 74) + ' ' + (cy - ry - 9) + ' H' + (x1 - 18) + ' A' + (rx + 4) + ' ' + (ry + 9) + ' 0 0 1 ' + (x1 - 18) + ' ' + (cy + ry + 9) +
         ' H' + (x1 - 74) + ' Z" fill="' + shade(base, -0.18) + '"/>';
    s += '<path d="M' + (x1 - 74) + ' ' + (cy - ry - 9) + ' A' + (rx + 4) + ' ' + (ry + 9) + ' 0 0 0 ' + (x1 - 74) + ' ' + (cy + ry + 9) +
         '" fill="' + shade(base, -0.34) + '"/>';
  }

  /* раструб на ближнем конце */
  var faceX = x0, faceRx = rx, faceRy = ry;
  if (v.socket) {
    faceRy = ry + 12; faceRx = rx + 4;
    s += '<path d="M' + (x0 + 52) + ' ' + (cy - ry) + ' L' + (x0 + 22) + ' ' + (cy - faceRy) + ' H' + x0 +
         ' A' + faceRx + ' ' + faceRy + ' 0 0 0 ' + x0 + ' ' + (cy + faceRy) + ' H' + (x0 + 22) +
         ' L' + (x0 + 52) + ' ' + (cy + ry) + ' Z" fill="url(#' + gBody + ')"/>';
  }

  /* ближний торец — концентрические слои */
  var rOut = 1;
  var acc = 0;
  s += '<ellipse cx="' + faceX + '" cy="' + cy + '" rx="' + faceRx + '" ry="' + faceRy + '" fill="' + shade(base, -0.15) + '"/>';
  for (var i = 0; i < layers.length; i++) {
    var frac = 1 - wf * acc;
    acc += layers[i].t;
    var fr = 1 - wf * acc;
    var k = Math.max(fr, 0.02);
    s += '<ellipse cx="' + faceX + '" cy="' + cy + '" rx="' + (faceRx * frac) + '" ry="' + (faceRy * frac) + '" fill="' + shade(layers[i].c, 0.12) + '"/>';
    if (i === layers.length - 1) {
      s += '<ellipse cx="' + faceX + '" cy="' + cy + '" rx="' + (faceRx * k) + '" ry="' + (faceRy * k) + '" fill="#1b2027"/>';
      s += '<ellipse cx="' + faceX + '" cy="' + cy + '" rx="' + (faceRx * k) + '" ry="' + (faceRy * k) + '" fill="none" stroke="#000" stroke-opacity=".35"/>';
    }
  }
  s += '<ellipse cx="' + faceX + '" cy="' + cy + '" rx="' + faceRx + '" ry="' + faceRy + '" fill="none" stroke="#0f172a" stroke-opacity=".28" stroke-width="1.5"/>';

  return s;
}

function squareBody(pipe, gBody, gFace, base, wf) {
  var s = '';
  var fx = 52, fy = 60, side = 92, dx = 112, dy = -34;
  var inner = side * wf * 2;
  /* верхняя грань */
  s += '<path d="M' + fx + ' ' + fy + ' L' + (fx + dx) + ' ' + (fy + dy) + ' L' + (fx + dx + side) + ' ' + (fy + dy) +
       ' L' + (fx + side) + ' ' + fy + ' Z" fill="' + shade(base, 0.42) + '"/>';
  /* правая грань */
  s += '<path d="M' + (fx + side) + ' ' + fy + ' L' + (fx + dx + side) + ' ' + (fy + dy) +
       ' L' + (fx + dx + side) + ' ' + (fy + dy + side) + ' L' + (fx + side) + ' ' + (fy + side) + ' Z" fill="' + shade(base, -0.34) + '"/>';
  /* передняя грань */
  s += '<rect x="' + fx + '" y="' + fy + '" width="' + side + '" height="' + side + '" fill="url(#' + gFace + ')"/>';
  /* отверстие */
  s += '<rect x="' + (fx + inner / 2) + '" y="' + (fy + inner / 2) + '" width="' + (side - inner) + '" height="' + (side - inner) + '" fill="#1b2027"/>';
  s += '<rect x="' + fx + '" y="' + fy + '" width="' + side + '" height="' + side + '" fill="none" stroke="#0f172a" stroke-opacity=".3" stroke-width="1.5"/>';
  /* блик на верхней грани */
  s += '<path d="M' + (fx + 12) + ' ' + (fy - 4) + ' L' + (fx + dx + 4) + ' ' + (fy + dy + 4) + ' L' + (fx + dx + 30) + ' ' + (fy + dy + 4) +
       ' L' + (fx + 38) + ' ' + (fy - 4) + ' Z" fill="#fff" opacity=".22"/>';
  return s;
}

/* ============================================================
   2. Схема сечения — послойный разрез с выносками
   ============================================================ */
function pipeSection(pipe) {
  var v = pipe.visual || {};
  var base = pipeBaseColor(pipe);
  var layers = (v.layers && v.layers.length) ? v.layers : [{ n: 'Материал', c: base, t: 1 }];
  var wf = v.wallFrac || 0.18;

  var cx = 190, cy = 205, R = 145;
  var boreR = R * (1 - wf);
  var gid = uid('sec');

  var s = '<svg class="pipe-section" viewBox="0 0 700 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Схема сечения: ' + esc(pipe.name) + '">';
  s += '<defs>' +
        '<radialGradient id="' + gid + '" cx="35%" cy="28%" r="80%">' +
          '<stop offset="0%" stop-color="#ffffff" stop-opacity=".38"/>' +
          '<stop offset="70%" stop-color="#ffffff" stop-opacity="0"/>' +
        '</radialGradient>' +
       '</defs>';

  s += '<text x="24" y="34" class="sec-title">Сечение и структура стенки</text>';

  /* послойные кольца */
  var acc = 0, mids = [];
  for (var i = 0; i < layers.length; i++) {
    var rOut = R - R * wf * acc;
    acc += layers[i].t;
    var rIn = R - R * wf * acc;
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + rOut.toFixed(1) + '" fill="' + layers[i].c + '"/>';
    mids.push({ r: (rOut + rIn) / 2, layer: layers[i] });
  }
  /* канал */
  s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + boreR.toFixed(1) + '" fill="#eef2f7"/>';
  s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + boreR.toFixed(1) + '" fill="none" stroke="#0f172a" stroke-opacity=".18"/>';
  s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="url(#' + gid + ')"/>';
  s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="#0f172a" stroke-opacity=".3" stroke-width="1.5"/>';

  /* проводники системы ОДК */
  if (v.wires) {
    var wr = R - R * wf * 0.55;
    s += '<circle cx="' + (cx - 34) + '" cy="' + (cy - wr * 0.72) + '" r="6" fill="#b4530f" stroke="#fff" stroke-width="1.5"/>';
    s += '<circle cx="' + (cx + 34) + '" cy="' + (cy - wr * 0.72) + '" r="6" fill="#b4530f" stroke="#fff" stroke-width="1.5"/>';
    s += '<text x="' + cx + '" y="' + (cy - wr * 0.72 + 26) + '" class="sec-note" text-anchor="middle">провода ОДК</text>';
  }

  /* размерные линии: наружный диаметр и стенка */
  s += '<line x1="' + (cx - R) + '" y1="' + (cy + R + 26) + '" x2="' + (cx + R) + '" y2="' + (cy + R + 26) + '" class="dim"/>';
  s += '<line x1="' + (cx - R) + '" y1="' + (cy + R + 20) + '" x2="' + (cx - R) + '" y2="' + (cy + R + 32) + '" class="dim"/>';
  s += '<line x1="' + (cx + R) + '" y1="' + (cy + R + 20) + '" x2="' + (cx + R) + '" y2="' + (cy + R + 32) + '" class="dim"/>';
  s += '<text x="' + cx + '" y="' + (cy + R + 46) + '" class="sec-dim" text-anchor="middle">D — наружный диаметр</text>';

  s += '<line x1="' + (cx - R) + '" y1="' + (cy - 8) + '" x2="' + (cx - boreR) + '" y2="' + (cy - 8) + '" class="dim"/>';
  s += '<text x="' + (cx - (R + boreR) / 2) + '" y="' + (cy - 16) + '" class="sec-dim" text-anchor="middle">s</text>';

  /* выноски и легенда */
  var n = mids.length;
  var top = 78, step = n > 1 ? Math.min(56, (300 - top) / n) : 0;
  for (var j = 0; j < n; j++) {
    var rowY = top + j * step + 12;
    var ang = (150 - j * (110 / Math.max(1, n - 1))) * Math.PI / 180;
    if (n === 1) ang = 55 * Math.PI / 180;
    var px = cx + mids[j].r * Math.cos(ang);
    var py = cy - mids[j].r * Math.sin(ang);
    s += '<polyline points="' + px.toFixed(1) + ',' + py.toFixed(1) + ' ' + (410) + ',' + rowY + ' ' + (424) + ',' + rowY + '" class="leader"/>';
    s += '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="3.5" fill="#0f172a"/>';
    s += '<rect x="' + 432 + '" y="' + (rowY - 9) + '" width="16" height="16" rx="3" fill="' + mids[j].layer.c + '" stroke="#0f172a" stroke-opacity=".25"/>';
    s += '<text x="' + 458 + '" y="' + (rowY + 4) + '" class="sec-label">' + esc(mids[j].layer.n) + '</text>';
  }

  s += '<text x="432" y="' + (top + n * step + 46) + '" class="sec-note">Пропорции слоёв показаны схематично</text>';
  s += '</svg>';
  return s;
}

/* ============================================================
   3. Мини-иконка материала (для таблиц сравнения)
   ============================================================ */
function pipeIcon(pipe, size, bore) {
  size = size || 40;
  bore = bore || '#eef2f7';
  var base = pipeBaseColor(pipe);
  var wf = (pipe.visual && pipe.visual.wallFrac) || 0.18;
  var r = size / 2 - 2;
  var s = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" class="pipe-icon">';
  if (pipe.shape === 'square') {
    s += '<rect x="2" y="2" width="' + (size - 4) + '" height="' + (size - 4) + '" rx="3" fill="' + base + '"/>';
    var in2 = (size - 4) * wf * 2;
    s += '<rect x="' + (2 + in2 / 2) + '" y="' + (2 + in2 / 2) + '" width="' + (size - 4 - in2) + '" height="' + (size - 4 - in2) + '" rx="2" fill="' + bore + '"/>';
  } else {
    var layers = (pipe.visual && pipe.visual.layers) || [{ c: base, t: 1 }];
    var acc = 0;
    for (var i = 0; i < layers.length; i++) {
      var rOut = r - r * wf * acc;
      acc += layers[i].t;
      s += '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + rOut.toFixed(1) + '" fill="' + layers[i].c + '"/>';
    }
    s += '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + (r * (1 - wf)).toFixed(1) + '" fill="' + bore + '"/>';
  }
  s += '</svg>';
  return s;
}

/* экранирование текста для вставки в SVG/HTML */
function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
