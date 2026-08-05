/* ============================================================
   Страница FAQ — аккордеон с поиском
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  mountChrome('faq.html');
  render('');
  document.getElementById('faqSearch').addEventListener('input', function () {
    render(this.value.trim().toLowerCase());
  });
});

function render(q) {
  var list = FAQ.filter(function (item) {
    return !q || (item.q + ' ' + item.a).toLowerCase().indexOf(q) >= 0;
  });

  var box = document.getElementById('faqList');
  if (!list.length) {
    box.innerHTML = '<div class="empty"><h3>Ничего не найдено</h3><p>Попробуйте другое слово — например «ГОСТ», «вес» или «давление».</p></div>';
    return;
  }

  box.innerHTML = list.map(function (item, i) {
    return '<div class="faq-item' + (q && list.length <= 3 ? ' open' : '') + '">' +
             '<button class="faq-q" type="button">' + esc(item.q) + '</button>' +
             '<div class="faq-a"><p style="margin:0">' + esc(item.a) + '</p></div>' +
           '</div>';
  }).join('');

  box.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.parentNode.classList.toggle('open');
    });
  });
}
