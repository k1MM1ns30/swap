// ─────────────────────────────────────────────────────────────────
//  SWAP — app.js
//
//  JS 수정 없이 NFC 태그 URL만으로 곡을 추가할 수 있습니다.
//
//  NFC 태그에 이 형식으로 URL을 쓰세요:
//    yoursite.com/?trackId=1806277323
//
//  Track ID 찾는 법:
//    브라우저에서 아래 URL 열기 → "trackId" 값 복사
//    https://itunes.apple.com/search?term=곡이름+아티스트&media=music&limit=1
// ─────────────────────────────────────────────────────────────────

// ─── URL에서 trackId 읽기 ─────────────────────────────────────────
const params  = new URLSearchParams(location.search);
const trackId = params.get('trackId'); // NFC 태그 URL에 심은 ID

// ─── 브라우저 언어로 iTunes 국가 코드 결정 ──────────────────────────
function getItunesCountry() {
  const lang  = (navigator.language || 'en-US');
  const parts = lang.split('-');
  if (parts.length >= 2) return parts[1].toLowerCase(); // "ja-JP" → "jp"
  const map = { ja:'jp', ko:'kr', zh:'cn', fr:'fr', de:'de', es:'es', pt:'br', it:'it', ru:'ru' };
  return map[parts[0].toLowerCase()] || 'us';
}


// ─────────────────────────────────────────────────────────────────
//  SHOW CONTENT — iTunes API 데이터로 UI 채우기
// ─────────────────────────────────────────────────────────────────
function showContent(data) {
  const artUrl = (data.artworkUrl100 || '').replace('100x100', '600x600');

  document.getElementById('albumArt').src           = artUrl;
  document.getElementById('trackName').textContent  = data.trackName        || '—';
  document.getElementById('artistName').textContent = data.artistName       || '—';
  document.getElementById('genreName').textContent  = data.primaryGenreName || '—';
  document.getElementById('appleMusicBtn').href     = data.trackViewUrl     || '#';
  document.getElementById('tokenId').textContent    = `SWAP 2026 · ${data.trackName || ''}`;

  document.getElementById('loadingWrap').style.display = 'none';
  document.getElementById('mainContent').classList.add('visible');

  document.getElementById('shareBtn').onclick = () => {
    navigator.share?.({
      title: `SWAP — ${data.trackName}`,
      text:  `${data.trackName} by ${data.artistName}`,
      url:   location.href,
    });
  };
}

// ─────────────────────────────────────────────────────────────────
//  SHOW ERROR
// ─────────────────────────────────────────────────────────────────
function showError() {
  document.getElementById('loadingWrap').style.display = 'none';
  document.getElementById('errorWrap').style.display   = 'flex';
}

// ─────────────────────────────────────────────────────────────────
//  FETCH — iTunes API에서 곡 정보 가져오기
// ─────────────────────────────────────────────────────────────────
function jsonpFetch(country) {
  return new Promise((resolve, reject) => {
    const cb    = `_sw${Date.now()}${country}`;
    const s     = document.createElement('script');
    const timer = setTimeout(() => { s.remove(); reject(new Error('timeout')); }, 8000);
    s.src       = `https://itunes.apple.com/lookup?id=${trackId}&entity=song&country=${country}&callback=${cb}`;
    s.onerror   = () => { clearTimeout(timer); reject(new Error('script load failed')); };
    window[cb]  = (json) => { clearTimeout(timer); delete window[cb]; s.remove(); resolve(json); };
    document.head.appendChild(s);
  });
}

async function fetchTrack() {
  if (!trackId) { showError(); return; }

  try {
    const country = getItunesCountry();

    // 로컬 스토어 + US 스토어 병렬 요청 (US가 이미면 한 번만)
    const [localData, usData] = country === 'us'
      ? [await jsonpFetch('us'), null]
      : await Promise.all([jsonpFetch(country), jsonpFetch('us')]);

    const localItem = localData?.results?.[0];
    const usItem    = usData?.results?.[0];

    if (!localItem || localItem.wrapperType === 'artist') { showError(); return; }

    // 트랙명·아티스트는 로컬, 장르는 항상 US(영어)
    showContent({ ...localItem, primaryGenreName: usItem?.primaryGenreName || localItem.primaryGenreName });
  } catch (err) {
    console.error('iTunes fetch error:', err);
    showError();
  }
}

// ─────────────────────────────────────────────────────────────────
//  COLLECT TOGGLE — 수집 상태를 trackId별로 localStorage에 저장
// ─────────────────────────────────────────────────────────────────
let collected = false;

function toggleCollect() {
  collected = !collected;
  document.getElementById('collectIcon').textContent  = collected ? '●' : '○';
  document.getElementById('collectLabel').textContent = collected ? 'Collected\n✓' : 'Collect\nToken';
  document.getElementById('collectBtn').classList.toggle('collected', collected);
  localStorage.setItem(`swap_${trackId}`, collected ? '1' : '0');

  document.querySelector('.album-img-wrap').animate(
    [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(360deg)' }],
    { duration: 700, easing: 'ease-in-out' }
  );
  setTimeout(() => {
    document.querySelector('.album-img-wrap').classList.toggle('colored', collected);
  }, 350);
}

function restoreCollectState() {
  if (localStorage.getItem(`swap_${trackId}`) === '1') toggleCollect();
}

// ─────────────────────────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────────────────────────
document.getElementById('collectBtn').addEventListener('click', toggleCollect);
restoreCollectState();
fetchTrack();