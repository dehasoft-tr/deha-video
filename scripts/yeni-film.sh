#!/bin/bash
# Şablondan yeni bir film klasörü kurar.
#   yeni-film.sh <hedef klasör> <oran: 9:16 | 16:9 | 1:1 | 4:5 | ENxBOY> [--fps 30] [--baslik "Başlık"]
#                [--gorunum gece|kum|orman|yakut|kagit|neon|nane|seker] [--senaryo <ad>]
#   yeni-film.sh --liste        görünümleri ve senaryoları listeler
set -euo pipefail
SK="$(cd "$(dirname "$0")/.." && pwd)"
if [ "${1:-}" = "--liste" ]; then
  echo "GÖRÜNÜMLER:"; for f in "$SK"/gorunumler/*.css; do printf '  %-8s %s\n' "$(basename "$f" .css)" "$(sed -n 's|^/\* \(.*\) \*/$|\1|p' "$f")"; done
  echo "SENARYOLAR:"; for f in "$SK"/senaryolar/*.json; do printf '  %-22s %s\n' "$(basename "$f" .json)" "$(sed -n 's/.*"_aciklama": "\(.*\)",$/\1/p' "$f")"; done; exit 0
fi
hedef="${1:?hedef klasör gerekli}"; oran="${2:?oran gerekli (9:16, 16:9, 1:1, 4:5 ya da 1080x1920)}"; shift 2
fps=30; baslik="Film"; gorunum="gece"; senaryo=""
while [ $# -gt 0 ]; do case "$1" in
  --fps) fps="$2"; shift 2;; --baslik) baslik="$2"; shift 2;; --gorunum) gorunum="$2"; shift 2;; --senaryo) senaryo="$2"; shift 2;;
  *) echo "bilinmeyen seçenek: $1" >&2; exit 1;; esac; done
case "$oran" in 9:16) W=1080; H=1920;; 16:9) W=1920; H=1080;; 1:1) W=1080; H=1080;; 4:5) W=1080; H=1350;; *x*) W="${oran%x*}"; H="${oran#*x}";; *) echo "bilinmeyen oran: $oran" >&2; exit 1;; esac
[ -f "$SK/gorunumler/$gorunum.css" ] || { echo "görünüm yok: $gorunum (yeni-film.sh --liste)" >&2; exit 1; }
[ -z "$senaryo" ] || [ -f "$SK/senaryolar/$senaryo.json" ] || { echo "senaryo yok: $senaryo (yeni-film.sh --liste)" >&2; exit 1; }
if [ -e "$hedef" ] && [ -n "$(ls -A "$hedef" 2>/dev/null)" ]; then echo "hedef klasör boş değil: $hedef" >&2; exit 1; fi
mkdir -p "$hedef"; hedef="$(cd "$hedef" && pwd)"
case "$hedef" in "$HOME") echo "ev klasörüne kurulmaz" >&2; exit 1;; esac
cp -R "$SK/template/." "$hedef/"; mkdir -p "$hedef/out" "$hedef/assets/vo/raw"
cp "$SK/gorunumler/$gorunum.css" "$hedef/css/gorunum.css"
[ -z "$senaryo" ] || cp "$SK/senaryolar/$senaryo.json" "$hedef/tools/narration.json"
for f in film.config.json index.html css/style.css; do sed -i '' -e "s/__W__/$W/g" -e "s/__H__/$H/g" -e "s/__FPS__/$fps/g" -e "s|__TITLE__|$baslik|g" "$hedef/$f"; done
echo "window.CFG={W:$W,H:$H,FPS:$fps};" > "$hedef/assets/config.js"
( cd "$hedef" && [ "$(pwd)" = "$hedef" ] && npm install --silent --no-audit --no-fund )
( cd "$hedef" && node tools/taslak-timeline.mjs )
echo "KURULDU $hedef (${W}x${H}, ${fps} fps, görünüm: $gorunum${senaryo:+, senaryo: $senaryo})"
