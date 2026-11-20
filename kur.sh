#!/bin/bash
# deha-video skill'ini bu makineye kurar: depoyu ~/.claude/skills/deha-video olarak bağlar ve gereksinimleri denetler.
#   ./kur.sh            kur (sembolik bağ; depoyu güncelleyince skill de güncellenir)
#   ./kur.sh --kopya    bağ yerine kopyala
set -euo pipefail
BURASI="$(cd "$(dirname "$0")" && pwd)"; HEDEF="$HOME/.claude/skills/deha-video"
mkdir -p "$HOME/.claude/skills"
if [ "$BURASI" = "$HEDEF" ]; then echo "Depo zaten skill klasöründe: $HEDEF"
elif [ -e "$HEDEF" ] || [ -L "$HEDEF" ]; then echo "Zaten var: $HEDEF (kaldırıp yeniden çalıştırın)"; exit 1
elif [ "${1:-}" = "--kopya" ]; then cp -R "$BURASI" "$HEDEF"; rm -rf "$HEDEF/.git"; echo "Kopyalandı: $HEDEF"
else ln -s "$BURASI" "$HEDEF"; echo "Bağlandı: $HEDEF -> $BURASI"; fi
eksik=0; var(){ if command -v "$1" >/dev/null 2>&1 || [ -x "/opt/homebrew/bin/$1" ]; then echo "  var   $1"; else echo "  EKSİK $1  ($2)"; eksik=1; fi; }
echo "Gereksinimler:"; var node "Node.js 20+"; var npm "Node.js ile gelir"; var ffmpeg "brew install ffmpeg"; var ffprobe "ffmpeg ile gelir"
if ls "$HOME/Library/Caches/ms-playwright" 2>/dev/null | grep -q '^chromium-'; then echo "  var   Playwright Chromium"; else echo "  EKSİK Playwright Chromium  (npx playwright install chromium)"; eksik=1; fi
"$BURASI/scripts/anahtar.sh" durum >/dev/null 2>&1 && echo "  var   Gemini API anahtarı" || echo "  YOK   Gemini API anahtarı  (pbpaste | $HEDEF/scripts/anahtar.sh kaydet) — seslendirmesiz film için gerekmez"
[ $eksik = 0 ] && echo "Hazır. Claude Code'da /deha-video yazın." || echo "Eksikleri kurduktan sonra hazır."
