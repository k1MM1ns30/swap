// ─────────────────────────────────────────────────────────────────
//  TOKEN MAP
//  각 토큰 번호 → Apple Music Track ID 매핑
//
//  Track ID 찾는 법:
//  1. Apple Music에서 곡 찾기
//  2. 공유 → 링크 복사
//     예: https://music.apple.com/jp/album/name/1422026861?i=1422027351
//  3. "?i=" 뒤 숫자가 Track ID
//
//  또는 iTunes Search로 확인:
//  https://itunes.apple.com/search?term=곡이름+아티스트&media=music&limit=1
// ─────────────────────────────────────────────────────────────────
const TOKEN_MAP = {
  '0001': '1422027351',  // King Gnu - Twillight!!
  '0002': '1109715071',  // Frank Ocean - Pink + White
  '0003': '1440818588',  // placeholder — replace with real ID
  // 토큰 추가 시 여기에 계속 입력...
};

// ─────────────────────────────────────────────────────────────────
//  URL PARAMS
//  사용법:
//    토큰 번호:    ?token=0001
//    Track ID 직접: ?trackId=1422027351
//    검색어:       ?q=twillight+king+gnu
// ─────────────────────────────────────────────────────────────────
const params   = new URLSearchParams(location.search);
const tokenNum = params.get('token') || '0001';
const directId = params.get('trackId');
const searchQ  = params.get('q');

// TOKEN_MAP 또는 직접 입력된 ID로 resolve
const itunesId = directId || TOKEN_MAP[tokenNum] || null;

// ─────────────────────────────────────────────────────────────────
//  SPARKLES
//  앨범 카드 위에 반짝이는 흰 점 생성
// ─────────────────────────────────────────────────────────────────
function addSparkles() {
  const layer = document.getElementById('sparkleLayer');
  for (let i = 0; i < 22; i++) {
    const el   = document.createElement('div');
    el.className = 'sp';
    const size = Math.random() * 5 + 2;
    el.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      top:  ${(Math.random() * 86 + 7).toFixed(1)}%;
      left: ${(Math.random() * 86 + 7).toFixed(1)}%;
      --dur: ${(1.4 + Math.random() * 2.2).toFixed(2)}s;
      --del: ${(Math.random() * 2).toFixed(2)}s;
      --lo:  ${(Math.random() * 0.3 + 0.1).toFixed(2)};
      --hi:  ${(Math.random() * 0.5 + 0.5).toFixed(2)};
    `;
    layer.appendChild(el);
  }
}

// ─────────────────────────────────────────────────────────────────
//  SHOW CONTENT
//  iTunes API 응답 데이터로 UI를 채움
// ─────────────────────────────────────────────────────────────────
function showContent(data) {
  // 앨범 아트: 100x100 → 600x600 고해상도로 교체
  const artUrl = (data.artworkUrl100 || '').replace('100x100', '600x600');
  document.getElementById('albumArt').src           = artUrl;
  document.getElementById('trackName').textContent  = data.trackName        || '—';
  document.getElementById('artistName').textContent = data.artistName       || '—';
  document.getElementById('genreName').textContent  = data.primaryGenreName || '—';
  document.getElementById('appleMusicBtn').href     = data.trackViewUrl     || '#';
  document.getElementById('tokenId').textContent    = `TOKEN #${tokenNum} · SWAP 2025`;

  // 로딩 숨기고 메인 콘텐츠 표시
  document.getElementById('loadingWrap').style.display = 'none';
  document.getElementById('mainContent').classList.add('visible');

  addSparkles();

  // 공유 버튼
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
//  FETCH FROM ITUNES API
// ─────────────────────────────────────────────────────────────────
async function fetchTrack() {
  try {
    let url;

    if (itunesId) {
      // Track ID로 정확하게 조회
      url = `https://itunes.apple.com/lookup?id=${itunesId}&entity=song`;
    } else if (searchQ) {
      // 검색어로 조회
      url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchQ)}&media=music&limit=1`;
    } else {
      showError();
      return;
    }

    const res  = await fetch(url);
    const json = await res.json();
    const item = json.results?.[0];

    // lookup이 artist wrapper를 반환하는 경우 처리
    if (!item || item.wrapperType === 'artist') {
      showError();
      return;
    }

    showContent(item);
  } catch (err) {
    console.error('iTunes fetch error:', err);
    showError();
  }
}

// ─────────────────────────────────────────────────────────────────
//  COLLECT TOGGLE
//  수집 상태를 localStorage에 토큰별로 저장
// ─────────────────────────────────────────────────────────────────
let collected = false;

function toggleCollect() {
  collected = !collected;

  document.getElementById('collectIcon').textContent  = collected ? '●' : '○';
  document.getElementById('collectLabel').textContent = collected ? 'Collected\n✓' : 'Collect\nToken';
  document.getElementById('collectBtn').classList.toggle('collected', collected);

  localStorage.setItem(`swap_collected_${tokenNum}`, collected ? '1' : '0');
}

// 이전 수집 상태 복원
function restoreCollectState() {
  const saved = localStorage.getItem(`swap_collected_${tokenNum}`);
  if (saved === '1') toggleCollect();
}

// ─────────────────────────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────────────────────────
document.getElementById('collectBtn').addEventListener('click', toggleCollect);
restoreCollectState();
fetchTrack();
