const entries = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (!key.startsWith('swap_')) continue;
  const val = localStorage.getItem(key);
  if (!val || val === '0') continue;
  try {
    const data = JSON.parse(val);
    if (data && data.trackName) entries.push(data);
  } catch {
    // 구버전 '1' 형식 — 메타데이터 없어서 표시 불가, 스킵
  }
}
entries.sort((a, b) => b.collectedAt - a.collectedAt);

const list  = document.getElementById('collList');
const empty = document.getElementById('collEmpty');
const count = document.getElementById('collCount');

count.textContent = `${entries.length} TRACK${entries.length !== 1 ? 'S' : ''}`;

if (entries.length === 0) {
  empty.style.display = 'flex';
} else {
  entries.forEach(track => {
    const item = document.createElement('a');
    item.className = 'coll-item';
    item.href = `index.html?trackId=${track.trackId}`;
    item.innerHTML = `
      <img class="coll-art" src="${track.artworkUrl}" alt="" />
      <div class="coll-info">
        <div class="coll-track">${track.trackName}</div>
        <div class="coll-artist">${track.artistName}</div>
        <div class="coll-genre">${track.genreName}</div>
      </div>
      <div class="coll-arrow">></div>
    `;
    list.appendChild(item);
  });
}
