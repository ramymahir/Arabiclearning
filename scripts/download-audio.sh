#!/usr/bin/env bash
# Download Arabic isolated-letter audio from arabicreadingcourse.com
# Run this from the project root on your LOCAL machine:
#   bash scripts/download-audio.sh
#
# Files are saved to public/letters/ and named to match the app's audioFile paths.

set -euo pipefail

BASE_URL="https://arabicreadingcourse.com/audio/isolated-letters"
OUT="public/letters"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
REF="https://arabicreadingcourse.com/"

mkdir -p "$OUT"

ok=0
fail=0

# Usage: try_download <app_name> <candidate1> [candidate2] ...
# Downloads the first URL that returns a valid MP3, saves as public/letters/<app_name>.mp3
try_download() {
  local app_name="$1"; shift
  local dest="$OUT/$app_name.mp3"

  if [[ -f "$dest" ]]; then
    echo "  ✓  $app_name.mp3 (already exists)"
    (( ok++ )) || true
    return 0
  fi

  for candidate in "$@"; do
    url="$BASE_URL/$candidate"
    http_code=$(curl -sSL -o /tmp/_arabic_dl.tmp \
      -w "%{http_code}" \
      -H "User-Agent: $UA" \
      -H "Referer: $REF" \
      "$url" 2>/dev/null || echo "000")

    if [[ "$http_code" == "200" ]]; then
      # Verify it looks like audio, not an HTML error page
      mime=$(file --mime-type -b /tmp/_arabic_dl.tmp 2>/dev/null || echo "unknown")
      if [[ "$mime" == audio/* ]] || [[ "$mime" == "application/octet-stream" ]]; then
        cp /tmp/_arabic_dl.tmp "$dest"
        printf "  ✓  %-12s ← %s\n" "$app_name.mp3" "$candidate"
        (( ok++ )) || true
        return 0
      fi
    fi
  done

  printf "  ✗  %-12s (not found — tried: %s)\n" "$app_name.mp3" "$*"
  (( fail++ )) || true
  return 0
}

echo ""
echo "Downloading 28 Arabic isolated-letter sounds"
echo "Source : $BASE_URL"
echo "Output : $OUT/"
echo ""

# Each line: <app_name> <candidate_filenames_to_try_in_order>
# The app expects public/letters/<app_name>.mp3
# Candidates are tried left-to-right; first 200 MP3 wins.

try_download alef    alef.mp3  alif.mp3  aleph.mp3
try_download ba      ba.mp3    baa.mp3   bah.mp3
try_download ta      ta.mp3    taa.mp3
try_download tha     tha.mp3   thaa.mp3  tsa.mp3
try_download jeem    jeem.mp3  jim.mp3   jim.mp3
try_download ha      ha.mp3    haa.mp3   hhaa.mp3   # ح (pharyngeal h)
try_download kha     kha.mp3   khaa.mp3  kha.mp3
try_download dal     dal.mp3   daal.mp3  dal.mp3
try_download dhal    dhal.mp3  dhaal.mp3 thal.mp3   zal.mp3
try_download ra      ra.mp3    raa.mp3
try_download zay     zay.mp3   zayn.mp3  zaa.mp3
try_download seen    seen.mp3  sin.mp3   siin.mp3
try_download sheen   sheen.mp3 shin.mp3  shiin.mp3
try_download sad     sad.mp3   saad.mp3  saud.mp3
try_download dad     dad.mp3   daad.mp3
try_download ta2     tta.mp3   taa2.mp3  ta2.mp3    emphatic-ta.mp3   # ط
try_download dha     dha.mp3   dhaa.mp3  dhaa2.mp3  emphatic-dh.mp3   # ظ
try_download ain     ain.mp3   ayn.mp3   3ain.mp3
try_download ghain   ghain.mp3 ghayn.mp3 ghain.mp3
try_download fa      fa.mp3    faa.mp3
try_download qaf     qaf.mp3   qaaf.mp3
try_download kaf     kaf.mp3   kaaf.mp3
try_download lam     lam.mp3   laam.mp3
try_download meem    meem.mp3  mim.mp3   miim.mp3
try_download noon    noon.mp3  nun.mp3   nuun.mp3
try_download ha2     ha2.mp3   haa2.mp3  hah.mp3    heh.mp3           # ه (glottal h)
try_download waw     waw.mp3   waaw.mp3
try_download ya      ya.mp3    yaa.mp3

echo ""
echo "─────────────────────────────────"
printf "  Downloaded : %d / 28\n" "$ok"
if [[ $fail -gt 0 ]]; then
  printf "  Missing    : %d\n" "$fail"
  echo ""
  echo "  For missing files, open your browser DevTools Console on"
  echo "  https://arabicreadingcourse.com and run the snippet in:"
  echo "  scripts/download-audio-browser.js"
fi
echo "─────────────────────────────────"
echo ""
echo "Next step: copy the files into your project and run:"
echo "  git add public/letters/*.mp3"
echo "  git commit -m 'feat: add Arabic letter audio files'"
echo ""
