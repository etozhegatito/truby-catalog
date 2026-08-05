#!/bin/sh
# Пересобирает PDF-версию презентации из presentation.html.
# Нужен установленный Google Chrome. Запуск: sh make-pdf.sh
DIR=$(cd "$(dirname "$0")" && pwd)
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

[ -x "$CHROME" ] || { echo "Не найден Google Chrome: $CHROME"; exit 1; }

"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
  --virtual-time-budget=6000 \
  --print-to-pdf="$DIR/trubprom-presentation.pdf" \
  "file://$DIR/presentation.html"

echo "Готово: $DIR/trubprom-presentation.pdf"
