/**
 * Browser console fallback for downloading Arabic letter audio.
 *
 * HOW TO USE:
 *   1. Open https://arabicreadingcourse.com in your browser
 *   2. Open DevTools → Console (F12 or Cmd+Opt+I)
 *   3. Paste this entire script and press Enter
 *   4. Allow the browser to download files when prompted
 *   5. Move the downloaded files into  public/letters/  in the project
 *      and rename them to match the "save as" column below.
 *
 * The script tries every candidate URL for each letter and downloads
 * the first one that returns audio.  Files auto-download one per second.
 */

const BASE = 'https://arabicreadingcourse.com/audio/isolated-letters';

// [appName, ...candidateFilenames]  — first hit wins
const LETTERS = [
  ['alef',  'alef.mp3','alif.mp3','aleph.mp3'],
  ['ba',    'ba.mp3','baa.mp3'],
  ['ta',    'ta.mp3','taa.mp3'],
  ['tha',   'tha.mp3','thaa.mp3'],
  ['jeem',  'jeem.mp3','jim.mp3'],
  ['ha',    'ha.mp3','haa.mp3','hhaa.mp3'],
  ['kha',   'kha.mp3','khaa.mp3'],
  ['dal',   'dal.mp3','daal.mp3'],
  ['dhal',  'dhal.mp3','dhaal.mp3','thal.mp3'],
  ['ra',    'ra.mp3','raa.mp3'],
  ['zay',   'zay.mp3','zayn.mp3','zaa.mp3'],
  ['seen',  'seen.mp3','sin.mp3'],
  ['sheen', 'sheen.mp3','shin.mp3'],
  ['sad',   'sad.mp3','saad.mp3'],
  ['dad',   'dad.mp3','daad.mp3'],
  ['ta2',   'tta.mp3','taa2.mp3','ta2.mp3'],
  ['dha',   'dha.mp3','dhaa.mp3','dha2.mp3'],
  ['ain',   'ain.mp3','ayn.mp3'],
  ['ghain', 'ghain.mp3','ghayn.mp3'],
  ['fa',    'fa.mp3','faa.mp3'],
  ['qaf',   'qaf.mp3','qaaf.mp3'],
  ['kaf',   'kaf.mp3','kaaf.mp3'],
  ['lam',   'lam.mp3','laam.mp3'],
  ['meem',  'meem.mp3','mim.mp3'],
  ['noon',  'noon.mp3','nun.mp3'],
  ['ha2',   'ha2.mp3','haa2.mp3','hah.mp3','heh.mp3'],
  ['waw',   'waw.mp3','waaw.mp3'],
  ['ya',    'ya.mp3','yaa.mp3'],
];

async function tryDownload(appName, candidates) {
  for (const file of candidates) {
    try {
      const res = await fetch(`${BASE}/${file}`);
      if (!res.ok) continue;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('audio') && !ct.includes('octet')) continue;

      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${appName}.mp3`;   // ← save with the app's expected name
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      console.log(`✓ ${appName}.mp3  ←  ${file}`);
      return true;
    } catch { /* try next */ }
  }
  console.warn(`✗ ${appName}.mp3  — not found (tried: ${candidates.join(', ')})`);
  return false;
}

(async () => {
  console.log('Starting download of 28 Arabic letter audio files...');
  let ok = 0;
  for (const [appName, ...candidates] of LETTERS) {
    const success = await tryDownload(appName, candidates);
    if (success) ok++;
    await new Promise(r => setTimeout(r, 900)); // 1 file/sec — avoids rate limiting
  }
  console.log(`\nDone: ${ok}/28 downloaded.`);
  console.log('Move the files to  public/letters/  in your project.');
})();
