#!/bin/bash
# Google AI Studio (Gemini) API anahtarını skill dışında, yalnız kullanıcının okuyabildiği bir dosyada tutar.
#   anahtar.sh durum            anahtar var mı (değeri yazdırmaz)
#   anahtar.sh kaydet           anahtarı standart girdiden okur:  pbpaste | anahtar.sh kaydet
#   anahtar.sh test             anahtarla erişilen seslendirme modellerini listeler (kota harcamaz)
set -euo pipefail
D="$HOME/.config/deha-video"; F="${DEHA_VIDEO_KEY_FILE:-$D/gemini.key}"
case "${1:-durum}" in
  durum) if [ -s "$F" ]; then echo "VAR $F ($(wc -c < "$F" | tr -d ' ') bayt, son değişiklik $(date -r "$F" '+%Y-%m-%d %H:%M'))"; else echo "YOK $F"; exit 1; fi;;
  kaydet) mkdir -p "$D"; chmod 700 "$D"; umask 077; tr -d ' \n\r' > "$F"; chmod 600 "$F"; [ -s "$F" ] && echo "KAYDEDİLDİ $F" || { echo "boş girdi" >&2; exit 1; };;
  test) [ -s "$F" ] || { echo "YOK $F" >&2; exit 1; }
    curl -s -H "x-goog-api-key: $(cat "$F")" "https://generativelanguage.googleapis.com/v1beta/models?pageSize=200" | python3 -c "
import sys,json
d=json.load(sys.stdin)
if 'error' in d: print('HATA', d['error'].get('status'), d['error'].get('message','')[:160]); sys.exit(1)
print('ANAHTAR ÇALIŞIYOR · seslendirme modelleri:'); [print(' ', m['name'].replace('models/','')) for m in d['models'] if 'tts' in m['name']]";;
  *) echo "kullanım: anahtar.sh durum|kaydet|test" >&2; exit 1;;
esac
